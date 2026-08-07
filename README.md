# ttyl

A quiet private feed-first messenger.

`ttyl` means **talk to you later**: write what matters, arrange where to meet, then go talk in real life.

The project intentionally starts small: invitation-only accounts, text-first communication, a shared threads feed, private chats, profiles, settings, light/dark themes, and a restrained interface inspired by the visual language of the `today` app.

## Branches

- `main` — stable branch; later this will become the source for production CI/CD.
- `development` — active development and prototypes.

## Prototype v0.1

The current `development` branch contains a dependency-free browser prototype with:

- a `today`-inspired warm light theme and matching dark theme;
- a start screen with `talk to / you later` and no public registration;
- a mock login flow;
- exactly four bottom navigation items: `threads`, `chats`, `profile`, `settings`;
- a line-separated shared threads feed with lowercase usernames and no avatar circles;
- private chat layout with quiet incoming text and soft outgoing message bubbles;
- a left-aligned minimal profile;
- settings and theme switching;
- simple local-only prototype interactions for posting, liking, and sending messages.

This is deliberately **UI-only**. Authentication, invitation management, password hashing, local PIN/device unlock, backend storage, WebSockets and end-to-end encryption are not implemented yet. No production deployment or CI/CD is configured yet.
