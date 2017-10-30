import map from 'lodash/map';
import React from 'react';
import PropTypes from 'prop-types';
import Flexbox from 'flexbox-react';

import dataBind from 'src/dbdi/react/dataBind';

import StageForm from './StageForm';

const StageContent = dataBind({
})(function StageContent(
  { thisNode, thisStagePath, thisPreviousStagePath, thisProjectId },
  { contributorGroupName },
  { currentUid }
) {

  const uid = currentUid;
  const projectId = thisProjectId;
  const stagePath = thisStagePath;
  //const previousStagePath = thisPreviousStagePath;
  const node = thisNode;
  //const customRender = customStageRenderers[node.stageId];
  const groupName = contributorGroupName({ uid, projectId });
  const forms = node.getForms(groupName);
  const formEls = map(forms, ({ id }) => (
    <Flexbox key={id}>
      <StageForm formName={id} />
    </Flexbox>
  ));

  // {customRender &&
  //   customRender(node, previousStagePath, stagePath, stageEntry, children)
  // }
  return (<Flexbox>
    {formEls}
  </Flexbox>);
});

export default StageContent;