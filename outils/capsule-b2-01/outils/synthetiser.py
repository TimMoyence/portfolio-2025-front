"""Synthèse Piper des plans de la capsule B2-01 et résolution des ancres temporelles.

Usage : python outils/synthetiser.py <racine medias>

Pour chaque sources/voix/Pnn.txt : un fichier build/audio/Pnn.wav (22 050 Hz, mono, 16 bits)
et build/audio/Pnn.json (durée exacte, phrases, alignements par phonème, instants des ancres
de sources/ancres.json).

La graine d'ONNX Runtime est posée avant chaque création de session : les deux nœuds
RandomNormalLike du modèle VITS n'ont pas d'attribut « seed » et tirent leur graine au
chargement du noyau, si bien que sans cela deux exécutions donnent des durées différentes.
"""

import hashlib
import json
import sys
import wave
from pathlib import Path

import onnxruntime
from piper import PiperVoice, SynthesisConfig

GRAINE = 20260919
LENGTH_SCALE = 1.15
MARQUES_IGNOREES = {"ˈ", "ˌ", "-", "^", "$", "_"}
PONCTUATION = set(",.:;!?()«»\"'’")


def normaliser(phonemes):
    """Chaîne comparable (sans accents toniques ni ponctuation) et index du phonème source."""
    caracteres, index = [], []
    for i, p in enumerate(phonemes):
        if p in MARQUES_IGNOREES:
            continue
        if p in PONCTUATION or p == " ":
            if caracteres and caracteres[-1] != " ":
                caracteres.append(" ")
                index.append(i)
            continue
        caracteres.append(p)
        index.append(i)
    return "".join(caracteres), index


def charger_voix(modele):
    onnxruntime.set_seed(GRAINE)
    return PiperVoice.load(
        str(modele), espeak_data_dir="espeak-ng-data", include_alignments=True
    )


def resoudre_ancre(voix, phrases, texte_ancre, frequence):
    cible = normaliser([p for phrase in voix.phonemize(texte_ancre) for p in phrase + [" "]])[0].strip()
    trouvees = []
    for phrase in phrases:
        phonemes = [p for p, _ in phrase["phonemes"]]
        cumul = [0]
        for _, n in phrase["phonemes"]:
            cumul.append(cumul[-1] + n)
        chaine, index = normaliser(phonemes)
        encadree = f" {chaine} "
        depart = 0
        while True:
            pos = encadree.find(f" {cible} ", depart)
            if pos < 0:
                break
            debut_car, fin_car = pos, pos + len(cible) - 1
            i_debut, i_fin = index[debut_car], index[fin_car]
            trouvees.append(
                {
                    "debut": (phrase["debut"] + cumul[i_debut]) / frequence,
                    "fin": (phrase["debut"] + cumul[i_fin + 1]) / frequence,
                }
            )
            depart = pos + 1
    return cible, trouvees


def main():
    racine = Path(sys.argv[1]).resolve()
    modele = racine / "modele" / "fr_FR-siwis-medium.onnx"
    sortie = racine / "build" / "audio"
    sortie.mkdir(parents=True, exist_ok=True)
    ancres = json.loads((racine / "sources" / "ancres.json").read_text("utf-8"))
    prononciation = json.loads((racine / "sources" / "prononciation.json").read_text("utf-8"))
    config = SynthesisConfig(length_scale=LENGTH_SCALE)

    def remplacer(plan, texte):
        for regle in prononciation.get(plan, []):
            texte = texte.replace(regle["texte"], regle["prononce"])
        return texte

    def prononcer(plan, texte):
        for regle in prononciation.get(plan, []):
            if regle["texte"] not in texte:
                raise SystemExit(f"{plan} : règle de prononciation sans effet « {regle['texte']} »")
        return remplacer(plan, texte)

    for fichier in sorted((racine / "sources" / "voix").glob("P*.txt")):
        plan = fichier.stem
        texte = fichier.read_text("utf-8").strip()
        texte_prononce = prononcer(plan, texte)
        voix = charger_voix(modele)
        frequence = voix.config.sample_rate
        phrases, total = [], 0
        with wave.open(str(sortie / f"{plan}.wav"), "wb") as wav:
            for i, morceau in enumerate(voix.synthesize(texte_prononce, syn_config=config, include_alignments=True)):
                if i == 0:
                    wav.setframerate(morceau.sample_rate)
                    wav.setsampwidth(morceau.sample_width)
                    wav.setnchannels(morceau.sample_channels)
                wav.writeframes(morceau.audio_int16_bytes)
                n = len(morceau.audio_int16_bytes) // 2
                if morceau.phoneme_alignments is None:
                    raise SystemExit(f"{plan} : alignements indisponibles")
                phrases.append(
                    {
                        "debut": total,
                        "echantillons": n,
                        "phonemes": [[a.phoneme, int(a.num_samples)] for a in morceau.phoneme_alignments],
                    }
                )
                total += n

        resolues, erreurs = {}, []
        for cle, texte_ancre in ancres.get(plan, {}).items():
            cible, trouvees = resoudre_ancre(voix, phrases, remplacer(plan, texte_ancre), frequence)
            if len(trouvees) != 1:
                erreurs.append(f"{plan}.{cle} « {texte_ancre} » [{cible}] : {len(trouvees)} occurrence(s)")
                continue
            resolues[cle] = {"texte": texte_ancre, **trouvees[0]}
        if erreurs:
            for phrase in phrases:
                print(" ", normaliser([p for p, _ in phrase["phonemes"]])[0], file=sys.stderr)
            raise SystemExit("\n".join(erreurs))

        empreinte = hashlib.sha256((sortie / f"{plan}.wav").read_bytes()).hexdigest()
        (sortie / f"{plan}.json").write_text(
            json.dumps(
                {
                    "plan": plan,
                    "texte": texte,
                    "texte_prononce": texte_prononce,
                    "frequence": frequence,
                    "echantillons": total,
                    "duree": total / frequence,
                    "sha256": empreinte,
                    "graine": GRAINE,
                    "length_scale": LENGTH_SCALE,
                    "ancres": resolues,
                    "phrases": phrases,
                },
                ensure_ascii=False,
                indent=1,
            ),
            "utf-8",
        )
        print(f"{plan} {total / frequence:7.3f} s  {empreinte[:12]}  {len(resolues)} ancres")


if __name__ == "__main__":
    main()
