import isEmpty from 'lodash/isEmpty';
import map from 'lodash/map';
import pickBy from 'lodash/pickBy';

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import autoBind from 'react-autobind';

import { dataBind } from 'dbdi/react';

import {
  Panel, Button, ListGroup, ListGroupItem, Alert, Badge
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/LoadIndicator';

import FancyPanelToggleTitle from 'src/views/components/util/FancyPanelToggleTitle';

import CohortEditor from './CohortEditor';

@dataBind({
  clickChangeToCohort(evt, { cohortId }, { setCurrentUserCohortId }) {
    setCurrentUserCohortId({ cohortId });
  }
})
class SwitchCohortButton extends Component {
  render({ }, { clickChangeToCohort }) {
    return <Button onClick={clickChangeToCohort}>Select this Cohort</Button>;
  }
}

@dataBind({

})
export class CohortPanel extends Component {
  state = {
    expanded: false
  };

  toggleExpand = () => {
    const { expanded } = this.state;
    this.setState({ expanded: !expanded });
  }

  render(
    { cohortId },
    { cohortName },
    { currentUserCohortId }
  ) {
    const name = cohortName({ cohortId });
    const { expanded } = this.state;

    return (<Panel key={cohortId} expanded={expanded} onToggle={this.toggleExpand}>
      <Panel.Heading>
        <Flexbox justifyContent="space-between" className="full-width">
          <FancyPanelToggleTitle compressed={true}>
            {cohortId}. {name} &nbsp;
          </FancyPanelToggleTitle>
          <>
            {cohortId !== currentUserCohortId &&
              <SwitchCohortButton cohortId={cohortId} />
            }
            {cohortId === currentUserCohortId &&
              <Badge>(currently selected cohort)</Badge>
            }
          </>
        </Flexbox>
      </Panel.Heading>
      <Panel.Body collapsible>
        {expanded && <CohortEditor cohortId={cohortId} />}
      </Panel.Body>
    </Panel>);
  }
}

@dataBind({

})
export class CohortTable extends Component {
  render(
    { },
    { },
    { cohortList }
  ) {
    return (<div>{
      map(pickBy(cohortList, (coh, id) => !!coh && !!id), (cohort, cohortId) => {
        return (<CohortPanel key={cohortId} cohortId={cohortId} />);
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