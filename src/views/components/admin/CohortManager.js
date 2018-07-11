import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

import ConfirmModal from 'src/views/components/util/ConfirmModal';
import { FAIcon } from 'src/views/components/util';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

import UserList from 'src/views/components/users/UserList';
import UserIcon from 'src/views/components/users/UserIcon';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';

@dataBind({
  clickChangeToCohort(evt, { cohortId }, { setCurrentUserCohortId }) {
    setCurrentUserCohortId({ cohortId });
  }
})
class SwitchCohortButton extends Component {
  render({ }, { clickChangeToCohort }) {
    return <Button onClick={clickChangeToCohort}>Switch</Button>;
  }
}

@dataBind({

})
export class CohortTable extends Component {
  render(
    { },
    { },
    { cohortList, currentUserCohortId }
  ) {
    return (<div>{
      map(cohortList, (cohort, cohortId) => {
        const {
          name
        } = cohort;

        return (<Panel key={name}>
          <Panel.Heading>{cohortId}. {name}</Panel.Heading>
          <Panel.Body>
            {
              cohortId !== currentUserCohortId && 
                <SwitchCohortButton cohortId={cohortId} />
            }
          </Panel.Body>
        </Panel>);
      })
    }</div>);
  }
}


@dataBind({})
export default class CohortManager extends Component {
  state = {
    expanded: false
  };

  toggleExpand = () => {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  onSelect = (fileId) => {
    this.setState({ selectedId: fileId });
  }

  render(
    { },
    { },
    { isCurrentUserAdmin, usersPublic_isLoaded }
  ) {
    if (!usersPublic_isLoaded) {
      return <LoadIndicator />;
    }
    if (!isCurrentUserAdmin) {
      return (
        <Alert bsStyle="warning">GM only</Alert>
      );
    }


    const { expanded } = this.state;

    return (<Panel expanded={expanded} onToggle={this.toggleExpand}>
      <Panel.Heading>
        <FancyPanelToggleTitle>
          Cohorts
        </FancyPanelToggleTitle>
      </Panel.Heading>
      <Panel.Body collapsible>
        <div>{expanded &&
          <CohortTable />
          || <div className="margin10" />
        }</div>
      </Panel.Body>
    </Panel>);
  }
}