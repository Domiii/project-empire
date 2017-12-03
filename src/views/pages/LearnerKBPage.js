import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Alert, Button, Jumbotron, Well, Panel
} from 'react-bootstrap';

import { LoadOverlay } from 'src/views/components/overlays';

import LearnerQuestionsOverview from 'src/views/components/kb/LearnerQuestionsOverview';

@dataBind()
export default class LearnerKBPage extends Component {
  static propTypes = {
  };

  constructor(...args) {
    super(...args);
  }

  render(
    { },
    { },
    { isCurrentUserAdmin, currentUser_isLoaded }
  ) {
    if (!currentUser_isLoaded) {
      return (<LoadOverlay />);
    }
    if (!isCurrentUserAdmin) {
      return (<Alert bsStyle="warning">GMs only :/</Alert>);
    }

    // const { mode, uid, questionId } = match.params;
    // const formProps = { mode, uid, questionId };
    return (
      <div>
        {/* <Panel bsStyle="primary" header="Learner KB"> */}
        <LearnerQuestionsOverview />
        {/* </Panel> */}
      </div>
    );
  }
}