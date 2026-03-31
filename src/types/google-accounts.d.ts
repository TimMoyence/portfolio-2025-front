declare namespace google.accounts.id {
  interface GsiButtonConfiguration {
    type?: "standard" | "icon";
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
  }

  interface CredentialResponse {
    credential: string;
    select_by: string;
    clientId?: string;
  }

  interface IdConfiguration {
    client_id: string;
    callback: (response: CredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: "signin" | "signup" | "use";
  }

  function initialize(config: IdConfiguration): void;
  function prompt(
    momentListener?: (notification: PromptMomentNotification) => void,
  ): void;
  function renderButton(
    parent: HTMLElement,
    options: GsiButtonConfiguration,
  ): void;
  function disableAutoSelect(): void;

  interface PromptMomentNotification {
    isDisplayMoment(): boolean;
    isDisplayed(): boolean;
    isNotDisplayed(): boolean;
    getNotDisplayedReason(): string;
    isSkippedMoment(): boolean;
    getSkippedReason(): string;
    isDismissedMoment(): boolean;
    getDismissedReason(): string;
  }
}
