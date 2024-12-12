# Formulate

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
