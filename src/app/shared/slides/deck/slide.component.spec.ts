import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { SlideComponent } from "./slide.component";
import { SlideDeckService } from "./slide-deck.service";

@Component({
  standalone: true,
  imports: [SlideComponent],
  template: `<app-slide id="hero" theme="dark">Contenu hero</app-slide>`,
})
class HostComponent {}

describe("SlideComponent", () => {
  let service: SlideDeckService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [SlideDeckService],
    });
    service = TestBed.inject(SlideDeckService);
  });

  it("rend la projection ng-content", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent.trim();
    expect(text).toBe("Contenu hero");
  });

  it("applique l'attribut id à la section", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector("section.slide");
    expect(section.id).toBe("hero");
  });

  it("applique la classe theme-<value>", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector("section.slide");
    expect(section.classList).toContain("theme-dark");
  });

  it("définit role et aria-roledescription", () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const section = fixture.nativeElement.querySelector("section.slide");
    expect(section.getAttribute("role")).toBe("region");
    expect(section.getAttribute("aria-roledescription")).toBe("slide");
  });

  it("s'enregistre auprès de SlideDeckService au montage", () => {
    spyOn(service, "register");
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(service.register).toHaveBeenCalledWith("hero");
  });

  it("se désinscrit au démontage", () => {
    spyOn(service, "unregister");
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    fixture.destroy();
    expect(service.unregister).toHaveBeenCalledWith("hero");
  });
});
