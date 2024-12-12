# YAAFF

Yet another auto form filler

![YAAFF](public/icons/yaaff128.png)

## Structure

The basic structure and logical flow of this extension is as follows:

```
popup.js (User clicks "Autofill")
     ↓
     Sends "triggerAutofill" message
     ↓
content.js (Receives message)
     ↓
     Extracts form structure
     ↓
     Sends to background.js for processing
     ↓
background.js (Receives form structure)
     ↓
     Calls OpenAI API
     ↓
     Returns mappings
     ↓
content.js (Receives mappings)
     ↓
     Fills form fields
     ↓
popup.js (Gets success/error response)
```

## TODO

- [x] Work with Chrome
- [x] Work with OpenAI
- [x] Build with webpack
- [ ] Ability to add new PII data from currently filled out form. Structure json file with current url -> xpath -> pii key -> pii value
- [ ] Nested json object, and then concat the keys together to get the pii key that is sent to the LLM. That can enable multiple different instances of the same type of value (i.e. specific login name for a website, where the first key is the website url and nested within it is username)
- [ ] CI/CD deployment to chrome store
- [ ] Encrypt PII data & API key in local storage
- [ ] Add support for other LLM providers (groq, claude, etc.)
- [ ] Work with Firefox
- [ ] Work with Safari
