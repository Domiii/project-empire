import { EmptyObject, EmptyArray } from 'src/util';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import { getStageFormRenderer } from './stageFormRenderers';

const StageForm = dataBind({
  onSubmit({ formData }, { itemId }, { set_item, push_item }, { }) {

  }
})(function StageForm(
  { formName, thisStagePath, thisProjectId },
  { get_stageFormData, onSubmit },
  { currentUid }
) {
  //const node = projectStageTree.getNodeByPath(stagePath)
  const uid = currentUid;
  const projectId = thisProjectId;
  const stagePath = thisStagePath;
  const formData = get_stageFormData({ projectId, stagePath, formName, uid }) || EmptyObject;
  const FormRender = getStageFormRenderer(formName);

  return <FormRender {...{ formData, onSubmit }} />;
});

export default StageForm;