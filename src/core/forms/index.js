
import map from 'lodash/map';
import mapValues from 'lodash/mapValues';
import groupBy from 'lodash/groupBy';
import isArray from 'lodash/isArray';
import isPlainObject from 'lodash/isPlainObject';

function fixOrderedProperties(arr, uiSchema) {
  const realProps = mapValues(groupBy(arr, 'id'), group => group[0]);
  uiSchema['ui:order'] = map(arr, 'id');

  if (realProps[''] || realProps.null || realProps[undefined]) {
    throw new Error('Found jsonschema-form property with undefined id: ' + 
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
    return fixSchema(v, uiSchema[k] = {});
  });
}

/**
 * We define properties as arrays because we want them to be sorted by default.
 */
export function fixSchema(o, uiSchema) {
  if (!isPlainObject(o)) {
    return o;
  }
  return mapValues(o, (v, k) => {
    const isProps = k === 'properties' && o.type === 'object';
    const isItems = k === 'items' && o.type === 'array';
    const goDeeper = isProps || isItems;
    if (goDeeper) {
      if (isProps) {
        // convert properties from array to object, and remember order in uiSchema instead
        return unravelProperties(v, uiSchema);
      }
      else if (isItems) {
        // go deeper
        return fixSchema(v, uiSchema.items = {});
      }
      throw new Error('woopsi something went wrong');
    }
    //return fixSchema(v, uiSchema);
    return v;
  });
}