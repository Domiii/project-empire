import map from 'lodash/map';
import isEmpty from 'lodash/isEmpty';

import React from 'react';
import PropTypes from 'prop-types';

import dataBind from 'src/dbdi/react/dataBind';

import Moment from 'react-moment';
import {
  Alert, Button,
  Well, Panel
} from 'react-bootstrap';
import Flexbox from 'flexbox-react';

import UserList from 'src/views/components/users/UserList';
import LoadIndicator from 'src/views/components/util/loading';


const LearnerStatusList = dataBind({})(
  ({ projectId }, { uidsOfProject }) => {
    if (!uidsOfProject.isLoaded({ projectId })) {
      return <LoadIndicator />;
    }
    else {
      const uids = Object.keys(uidsOfProject({ projectId }));

      if (isEmpty(uids)) {
        return (<Alert bsStyle="warning" style={{ display: 'inline' }} className="no-padding">
          <span>this project has no team yet</span>
        </Alert>);
      }
      else {
        return (<div>
          <span>Team ({size(uids)}):</span> <UserList uids={uids} />
        </div>);
      }
    }
  }
);

export default LearnerStatusList;