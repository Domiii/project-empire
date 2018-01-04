import {
  hrefMission
} from 'src/views/href';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Well, Panel,
  Badge
} from 'react-bootstrap';

import { LinkContainer } from 'react-router-bootstrap';

import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';



const MissionHeader = dataBind({})(function MissionHeader(
  { },
  { get_mission, lookupLocalized, getProps },
  { isCurrentUserAdmin }
) {
  const {
    missionId,
    editing,
    ...moreProps
  } = getProps();

  const isMissionLoaded = get_mission.isLoaded({ missionId });

  if (!isMissionLoaded) {
    return <LoadIndicator />;
  }
  else {
    const mission = get_mission({ missionId });
    if (!mission) {
      return '<unknown mission>';
    }

    const {
      category,
      author
    } = mission;

    const title = lookupLocalized({ obj: mission, prop: 'title' });

    return (<h3 className="no-margin no-padding">
      <Flexbox justifyContent="space-between" alignItems="center">
        <Flexbox {...moreProps}>
          {title}
        </Flexbox>
        <Flexbox>
          <Badge>{category}</Badge>
          {isCurrentUserAdmin && <span>
            <LinkContainer to={hrefMission(missionId, !editing)}>
              <Button active={editing}
                className="" bsSize="small">
                <FAIcon name="edit" />
              </Button>
            </LinkContainer>
          </span>}
        </Flexbox>
      </Flexbox>
    </h3>);
  }
});

export default MissionHeader;