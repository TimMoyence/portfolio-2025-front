import type { ContactMethod } from '../models/contact-method.model';
import { COORDONNEES_DU_SITE } from './coordonnees';

export const CONTACT_METHODS: readonly ContactMethod[] = [
  {
    label: $localize`:contact.method.email.label|Contact method label@@contactMethodEmailLabel:Email`,
    value: COORDONNEES_DU_SITE.email,
    href: COORDONNEES_DU_SITE.mailto,
    icon: 'attach_email',
  },
  {
    label: $localize`:contact.method.phone.label|Contact method label@@contactMethodPhoneLabel:Téléphone`,
    value: COORDONNEES_DU_SITE.telephone,
    href: COORDONNEES_DU_SITE.tel,
    icon: 'phone',
  },
  {
    label: $localize`:contact.method.office.label|Contact method label@@contactMethodOfficeLabel:Bureau`,
    value: COORDONNEES_DU_SITE.bureau,
    href: COORDONNEES_DU_SITE.carte,
    icon: 'location_on',
  },
];
