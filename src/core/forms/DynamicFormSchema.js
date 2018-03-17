
//import dataSourceTree from 'src/core/dataSourceTree';

//import { EmptyObject, EmptyArray } from 'src/util';

import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import forEach from 'lodash/forEach';
import pickBy from 'lodash/pickBy';
import groupBy from 'lodash/groupBy';
import isArray from 'lodash/isArray';
import isFunction from 'lodash/isFunction';
import isPlainObject from 'lodash/isPlainObject';
import isEqual from 'lodash/isEqual';


function fixOrderedProperties(arr, uiSchema) {
  const realProps = mapValues(groupBy(arr, 'id'), group => group[0]);
  uiSchema['ui:order'] = map(arr, 'id');

  if (realProps[''] || realProps.null || realProps[undefined]) {
    throw new Error('Found jsonschema-form property missing id: ' + 
      JSON.stringify(arr));
  }

  return realProps;
}


function unravelProperties(o, uiSchema) {
  let propertiesObj;
  if (isArray(o)) {
    propertiesObj = fixOrderedProperties(o, uiSchema);
  }
  else {
    propertiesObj = o;
  }

  return mapValues(propertiesObj, (v, k) => {
    return normalizeSchema(v, uiSchema[k] = uiSchema[k] || {});
  });
}

/**
 * Build schema from template with custom node building functions
 * and conditionals.
 */
export function buildSchemaFromTemplate(o, allBuilderArgs) {
  const isArr = isArray(o);
  if (!isPlainObject(o) && !isArr) {
    return o;
  }

  let result = isArr ? [] : {};
  function addToResult(k, v) {
    if (isArr) {
      result.push(v);
    }
    else {
      result[k] = v;
    }
  }

  forEach(o, (v, k) => {
    if (isFunction(v)) {
      // custom node
      v = v(...allBuilderArgs);
    }

    // check for conditional node
    if (!v || !v.if || v.if(...allBuilderArgs)) {
      addToResult(k, buildSchemaFromTemplate(v, allBuilderArgs));
    }
  });

  return result;
}


export function requiredProperties(resultSchema, properties) {
  if (!resultSchema.required) {
    resultSchema.required = [];
    forEach(properties, (v, k) => {
      if (v && !v.isOptional) {
        resultSchema.required.push(k);
      }
    });
  }
}

/**
 * We have a slightly customized format because we want to 
 * have properties ordered + required by default.
 */
export function normalizeSchema(o, uiSchema) {
  if (!isPlainObject(o)) {
    return o;
  }

  const normalizedSchema = {};
  
  forEach(o, (v, k) => {
    const isProps = k === 'properties' && o.type === 'object';
    const isItems = k === 'items' && o.type === 'array';
    const goDeeper = isProps || isItems;

    let child;
    if (goDeeper) {
      if (isProps) {
        // convert properties from array to object, and remember order in uiSchema instead
        child = unravelProperties(v, uiSchema);
        requiredProperties(normalizedSchema, child);
      }
      else if (isItems) {
        // go deeper
        child = normalizeSchema(v, uiSchema.items = {});
      }
      else {
        throw new Error('woopsi something went wrong');
      }
    }
    else {
      child = v;
    }
    
    normalizedSchema[k] = child;
  });

  return normalizedSchema;
}

/**
 * Only get the data from formData that is defined in the schema
 */
export function extractSchemaData(formData, schema) {
  if (schema.type === 'array') {
    const arr = [];
    for (let i = 0; i < formData.length; ++i) {
      extractSchemaData[i] = extractSchemaData(formData[i], schema.items);
    }
    return arr;
  }
  else if (schema.type === 'object') {
    const obj = {};
    for (const key in schema.properties) {
      const propSchema = schema.properties[key];
      
      obj[key] = extractSchemaData(formData, propSchema);
    }
    return obj;
  }
  return formData;
}


export function isFormDataEqual(formData1, formData2, schema) {
  if (schema.type === 'array') {
    if (!!formData1 !== !!formData2) {
      return false;
    }
    if (formData1 === null || formData1 === undefined) {
      // both sides are not set yet
      return true;
    }
    if (formData1.length !== formData2.length) {
      return false;
    }
    if (!isArray(formData1) || !isArray(formData2) || formData1.length !== formData2.length) {
      return false;
    }
    for (let i = 0; i < formData1.length; ++i) {
      if (!isFormDataEqual(formData1[i], formData2[i], schema.items)) {
        return false;
      }
    }
    return true;
  }
  else if (schema.type === 'object') {
    if (!!formData1 !== !!formData2) {
      return false;
    }
    if (formData1 === null || formData1 === undefined) {
      // both sides are not set yet
      return true;
    }
    for (const key in schema.properties) {
      const propSchema = schema.properties[key];
      
      if (!isFormDataEqual(formData1[key], formData2[key], propSchema)) {
        return false;
      }
    }
    return true;
  }
  return isEqual(formData1, formData2);
}

/**
 * Allow form schemas to be built dynamically
 */
export default class DynamicFormSchemaBuilder {
  template;

  constructor(template) {
    this.template = template;
  }

  build(uiSchema, allBuilderArgs) {
    const customSchema = buildSchemaFromTemplate(this.template, allBuilderArgs);
    return normalizeSchema(customSchema, uiSchema);
  }
}