import partyPrepareMeeting from './partyPrepareMeeting';
import partySprintWrapup from './partySprintWrapup';

import { fixSchema } from 'src/core/forms';

import mapValues from 'lodash/mapValues';

let forms = {
  partyPrepareMeeting,
  partySprintWrapup
};

export const uiSchemas = {};



/**
 * For some stupid reason, the order of items is understood as 
 * part of the UI, not the model, in the "jsonschema-form" library.
 */
forms = mapValues(forms, (form, formName) => 
  fixSchema(form, uiSchemas[formName] = {}));


export default forms;