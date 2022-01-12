# Changelog

## 1.5.0 - ???

### BREAKING CHANGES

- For page rows, `className` property is split up into `containerClassName` and `rowClassNameOverride` to be able to customize both the containers class and override the default "row" className of the div.
- Updated to `survey-engine` v1 track that causes changes of the import path for these libs. Update for survey-engine lib is necessary.
- Signup success dialog: the dialog supports now checking verification status (reloading the user) for the case the verification was successful on an other tab or device. This requires additional translations for the `signupSuccessDialog` in the `dialogs.json` translation file.
  Following attributes are new: (with example)
  - `"msgForVerifiedAccount": "If you have just verified your account, you can use the button below to reload this page."`
  - `"reloadUser": "Check verification"`
  - `"errors.verifyEmailFirst": "You need to verify your email address first by clicking the link in the registration email. If you cannot find the email, use the button to send a new email."`
- Newer version of `react-i18n` handling plurals differently than before. Instead of `_plural` suffix, use `_other`.

### Added

- Support for globally defined translations. Page item keys can incllude the namespace `global:itemKey`, so that the translation is not searched on the current page's json file, but in the `global.json`.
- New page item type `actionCard` that utilises the ActionCard component from case-web-ui.
- Added license file.
- `AppCore` now accepts a list of custom survey response compoents to extend what response items a survey can use. Define the list through the prop `customSurveyResponseComponents`.
- New API methods to work with temporary participants.
- New exported component to prevent that can be used to prevent accidental navigation: `PreventAccidentalNavigationPrompt`.

### Changed

- External extension components receive a method `onNavigate: (url: string) => void`, to handle internal page navigation.
- Accordion list page item accepts className attribute to add a css class to container item.
- Replaced `node-sass` with `sass` to allow using newer nodeJS versions.
- Storybook is using webpack 5 now.
- Exporting studyAPI and reudx actions so these can be used from extension components.

### Fixes

- Sub-routes can also access extensions.
- Login and signup dialogs have improved behaviour regarding if the navigate away after successful action.
- Survey mode header handles undefined profile better.

## 1.4.0 - 2021-11-19

### BREAKING CHANGES

- `@material-ui/core` is no longer a dependency of this library.
- Navbar:
  - translation files for the navbar (`locales/<languageCode>/navbar.json`) should include `toggleBtn` and `toggleBtnAriaLabel` to localise the text behind the navigation toggle on small screens.

### Added

- The app core component can receive a list of custom react components to extend the content renderer with custom components. Simply pass down an array of `{ name: <nameOfTheComponent>, component: <react functional component>}` items. In the page configuration, you can refer to the component with the `name`. The custom component is able to call the `props.renderGenericItemFunc(item)` method which allows you the nesting of generic and custom components.
- Navbar now supports dropdown menu item to implement nested navigation / menus with more content.
- Page can contain `subPages` that are renderes as direct child routes. Rows (if any) are rendered on top first.
- New item types for page content:
  - Subrouter component implemented: type `router`.
  - To wrap items with an html div: type `container`.

### Changed

- Changed implementation of the Navbar and the Drawer for small screens.
- Verification Code input form will ignore '-' charaters (does not matter for validation or matching if you use hyphens or not). This way, we can send better formatted emails, using a hyphen in the email body to make code more readable.
- Can override navbar's right side action items.
- Updated project dependencies.

## 1.3.0 - 2021-10-20

### Added

- Email address at signup will be validation with stronger rules to prevent entering invalid email address. To set language specific error message, you can use the translation object's value of `signup.errors.emailRules`.

## [1.2.0] - 2021-10-19

### Added

- New component for placeholder item

### Changed

- Updated dependencies


## [1.1.0] - 2021-07-08

### Added

- send selected language code with survey response object in the context

### Changed

- [BREAKING-CHANGE]: updated dependencies - react markdown renderer needs new format. See documentation here:
https://github.com/coneno/case-web-ui/blob/master/CHANGELOG.md#breaking-changes


## [1.0.19]

### Changed

- Support `VideoPlayer`'s track propetry to define subtitles
- Updating dependencies. Using stable bootstrap version.


## [1.0.18]

### Changed

- `AccountSettings` component: attribute renamed (and connected) for hiding the profile settings button. Attribute name is called now: `hideProfileSettings`. It is an optional attribute accepting boolean values.
- Updating dependecies.

### [1.0.17]

## Added

- New environment variable `REACT_APP_DISABLE_SIGNUP`. If defined as "true", nav-link from the navbar and from the login dialog is removed. If not defined or has any other value, it won't have any effect.

### Changed

- *BREAKING*: at signup request sent to the backend, it will send the instanceID as http header. This requires a participant-api (api-gateway) with v0.13.0 or later. This header field was included for providing the instanceID for reCaptcha validation.
- Updating project dependencies (case-web-ui), with minor improvements.

## [1.0.16]

### Changed

- Parse survey's validFrom and validUntil properties correctly. (gRPC sends them as strings, needs conversion)

- Updated case-web-ui dependency to deal with missing options in the single or multiple choice survey components more gracefully.

## [1.0.15]

### Changed

- Updated project dependecies

## [1.0.14]

### Added

- Store language selection into localStorage. When opening an other tab, reloading or revisiting the page, this selection will be picked up and used. If the item is not available in the local storage, the default language defined by the environment variable will be used.

### Changed

- Updated dependencies - case-web-ui's new version with support for multiple choice subtitles and markdown survey component
- NavLink items remove `type="button"` that causes wrong styling in Safari.
