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
import Flexbox from 'flexbox-react';

import LoadIndicator from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';



const MissionHeader = dataBind({})(function MissionHeader(
  { missionId },
  { missionById }
) {
  const isMissionLoaded = missionById.isLoaded({ missionId });

  if (!isMissionLoaded) {
    return <LoadIndicator />;
  }
  else {
    const mission = missionById({ missionId });
    if (!mission) {
      return '<unknown mission>';
    }

    const {
      title,
      category,
      author
    } = mission;

    return (
      <Flexbox justifyContent="space-between" alignItems="center">
        <Flexbox>
          {title}
        </Flexbox>
        <Flexbox>
          <Badge>{category}</Badge>
        </Flexbox>
      </Flexbox>
    );
  }
});

export default MissionHeader;