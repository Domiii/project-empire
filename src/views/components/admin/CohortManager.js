import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import filter from 'lodash/filter';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';

import LoadIndicator from 'src/views/components/util/LoadIndicator';

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
    console.warn(cohortList);
    return (<div>{
      map(filter(cohortList, (coh, id) => !!coh && !!id), (cohort, cohortId) => {
        const {
          name
        } = cohort;

        return (<Panel key={cohortId}>
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