# Engineering documentation

These documents define how ncasa-fe is designed and changed. They are instructions for both human
contributors and coding agents.

| Document | Read when |
| --- | --- |
| [Architecture](./ARCHITECTURE.md) | Changing features, domain behavior, state, routes, API or persistence |
| [Testing](./TESTING.md) | Adding, fixing, refactoring or reviewing behavior |
| [Angular guidelines](./ANGULAR_GUIDELINES.md) | Changing components, templates, forms, styles or accessibility |
| [Internationalization](./I18N.md) | Adding or changing user-facing copy, locales or formatting |

The root `AGENTS.md` contains the short mandatory rules Codex loads automatically. These documents
contain the rationale, examples and decision criteria. If code and documentation disagree, do not
guess: determine whether the code is legacy debt or the documented decision has changed, then update
the appropriate side explicitly.

## Decision order

When two approaches seem possible, prefer the one that:

1. preserves domain correctness;
2. respects inward dependency direction;
3. is easiest to test through public behavior;
4. keeps feature ownership clear;
5. uses the simplest design that supports the current requirement;
6. preserves accessibility and user experience.

Architecture is a means of controlling change, not a target number of folders or classes.
