# YAAFF

Yet another auto form filler

![YAAFF](public/icons/yaaff128.png)

## Structure

The basic structure and logical flow of this extension is as follows:

```
widget_popup.js (User clicks "Autofill")
     ↓
     Sends "triggerAutofill" message
     ↓
web_content_handler.js (Receives message)
     ↓
     Extracts form structure
     ↓
     Sends to background_worker.js for processing
     ↓
background_worker.js (Receives form structure)
     ↓
     Calls OpenAI API
     ↓
     Returns mappings
     ↓
web_content_handler.js (Receives mappings)
     ↓
     Fills form fields
     ↓
widget_popup.js (Gets success/error response)
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
- [ ] Cross deployment script
- [ ] Work with Firefox
- [ ] Work with Safari
- [x] Add cool (silly?) logo... The GirYAAFF
- [ ] Locally cache all web form inputs. Additionally store the url and site context to allow it to be used in similar but not necessarily an identical URL (e.g. diff airlines -- same data but just slightly diff form) that will be included in the context window
- [ ] Above can be just started with keeping things by URL, no addtl metadata
- [ ] Rename piiData or userData?
- [ ] Handle dropdowns/radio buttons/date inputs (I think just all structured inputs). Right now we don't read those elements or write them back to the page at all.
