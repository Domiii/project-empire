import 'merge' from 'lodash/merge';
import 'forEach' from 'lodash/forEach';
import 'map' from 'lodash/map';

import React from 'react';
import Form from 'react-jsonschema-form';

import partyPrepareMeeting from './partyPrepareMeeting';


const _stageFormRenderAll = {
  partyPrepareMeeting
};


const defaultFormRenderSettings = {

  schema={ FormSchema }
    liveValidate={ true}
    uiSchema={ FormUISchema }
    fields={ CustomFields }
    formData={ data }
    showErrorList={ false}
    onChange={ itemLog('changed') }
    onError={ itemLog('errors') }
    onSubmit={ onSubmit }
};


function defaultFormRender(settings) {
  return (<Form >
    {/* the Form children are rendered at the bottom of the form */}
    <div>
      <button type="submit" className="btn btn-info">
        {alreadyExists ? 'Update' : 'Add new'}
      </button>
      {alreadyExists &&
        <ConfirmModal
          header="Confirm DELETE"
          ButtonCreator={ItemDeleteButton}
          onConfirm={doDelete}>

          <span>{data.title}</span>

        </ConfirmModal>
      }
    </div>
  </Form>);
};



const stageFormRenderSettings = forEach(_stageFormRenderAll, info => 
  merge({}, info.settings, defaultFormRenderSettings));

const stageFormRenderers = map(stageFormRenderers, (FormRender, name) => {
  render = render || defaultFormRender;
  const settings = stageFormRenderSettings[name] || {};

  return (props) => (
    <div>
      <FormRender 
        {...props}
        {...settings}
      />
    </div>
  );
});

export function getStageFormRenderer(name) {
  if (!stageFormRenderers[name]) {
    throw new Error(`Tried to get invalid StageFormRenderer "${name}"`);
  }
  return stageFormRenderers[name];
}

export default stageFormRenderers;