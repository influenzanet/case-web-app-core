# Changelog

## 2.7.1 - 2023-03-28

### Changed

- Extension components should also receive the date locales through props
- Added the `GenericPageItemProps` interface that can be used for extension component props to extend it with their custom props.

## 2.7.0 - 2023-01-24

### Changed

- [PR8](https://github.com/coneno/case-web-app-core/pull/8):
  - add the possibility to customise redirect URL after login from an email link.
  - update dependencies

## 2.6.0 - 2022-11-23

### Changed

- [PR7](https://github.com/coneno/case-web-app-core/pull/7): adding more configuration options regarding 2FA and dialog size.

## 2.5.0 - 2022-10-21

### BREAKING CHANGE

- Updated survey-engine and case-web-ui to be able to use the new survey data model.

### Changed

- Updated dependencies.

## 2.4.2 - 2022-09-14

### Changed

- Survey page won't open "immediate" survey if has validUntil that is not in the future.

## 2.4.1 - 2022-09-09

### Changed

- After upgrade to bootstrap 5.2.1 nav-link component and dropdown-items were styled differently than before. This update fixes the behaviour change to reproduce the previous one.

## 2.4.0 - 2022-09-08

### BREAKING CHANGES

- Added new survey component with chainable surveys, and support for temporary participants
  - New translations required: see an example in exampleContent/static-content/locales/nl-be/surveyPage.json

### Added

- Can define a "notFound" route to override what should happen when the requested URL is not available. This changes the current behaviour to always forward to `.auth` or `.unauth` default route. If no `.notFound` route is provided, it falls back to the current behavior.

### Changed

- iFrame component accepts the optional "log" attribute [boolean], instead of having it default `true`
- Updated external dependencies to patch versions
- Fixes provided through PR #4 and #6

## 2.3.4 - 2022-07-22

### Changed

- Updated dependencies
- Add copyright prop support for teaser image
- Can hide content of action card

## 2.3.3 - 2022-07-14

### Changed

- add userAPI to exported modules

## 2.3.2 - 2022-07-07

### Changed

- defaultRoute's attributes optional

## 2.3.1 - 2022-07-07

### Changed

- Added logic to handle default routes for router page components and sub-pages.

## 2.3.0 - 2022-07-07

### Changed

- Add new pageConfig attribute to be able to configure helmet overrides for a page either from local translation file, or from global translation json.

## 2.2.0 - 2022-06-22

### Added

- New page content type for resizable iframes. This relies on the libarary: <https://github.com/davidjbradshaw/iframe-resizer-react>. For more details of how to properly connect cross-domain iframes, check out the examples there.

### Changed

- Updated external libraries

## 2.1.0 - 2022-05-11

### Added

- New page component "helmet" that utilises a react helmet component to override the current page's title and meta description.

### Changed

- Updated external libraries.

## 2.0.1 - 2022-03-15

- Improve navbar styles for accessibility

## 2.0.0 - 2022-03-10

### BREAKING CHANGES

- List of supported date locales from date-fns needs to be now explicitly passed down as an attribute for AppCore. (`dateLocales?: Array<{ code: string, locale: any, format: string }>;`). For an example, see `ParticipantApp.stories.tsx`. The passed down locales, will be registered for react-datepicker in the DateInput response component, when it's first initialized.
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
- New study api call for downloading user reports
- New study api call for uploading participant files
- Add new exported component `InternalNavigator`, to use internal react-router instance to navigate in custom components.

### Changed

- External extension components receive a method `onNavigate: (url: string) => void`, to handle internal page navigation.
- Accordion list page item accepts className attribute to add a css class to container item.
- Replaced `node-sass` with `sass` to allow using newer nodeJS versions.
- Storybook is using webpack 5 now.
- Exporting studyAPI and reudx actions so these can be used from extension components.
- Survey component is using isLoggedIn attribute on survey context.
- Email validation rule during signup has been replaced to allow characters that are supported by the standard (.e.g, 'x').
- Include the possibility to customize footer column's className.
- Dialog config includes optional info about origin, to signalize where the dialog was opened from.
- Can open manage profiles dialog if not verified yet. (Needed to finish initial survey flow.)

### Fixes

- Sub-routes can also access extensions.
- Login and signup dialogs have improved behaviour regarding if the navigate away after successful action.
- Survey mode header handles undefined profile better.

## 1.4.1 - 2022-01-20

### Added

- Can trigger dialog opening with url query param ?action=openSignupDialog

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
<https://github.com/coneno/case-web-ui/blob/master/CHANGELOG.md#breaking-changes>

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
