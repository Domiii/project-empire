import React, { Component, Fragment as F } from 'react';
import dataBind from 'src/dbdi/react/dataBind';

import {
  Panel, Well, Alert
} from 'react-bootstrap';

import { Link } from 'react-router-dom';
import Flexbox from 'flexbox-react';

import { hrefPresentationSession } from '../../href';
import styled from 'styled-components';


const StyledWell = styled(Well) `
text-align: center;
background-color: transparent;
`;

const Title = styled.h2`
white-space: nowrap;
text-overflow: ellipsis;
margin: auto;
`;


function getSelectedId() {
  return window.location.hash && window.location.hash.substring(1);
}

@dataBind()
export default class LiveHeader extends Component {
  render(
    { },
    { },
    { livePresentationSessionId }
  ) {
    if (livePresentationSessionId) {
      return (<StyledWell>
        <Flexbox justifyContent="space-between" align-items="center">
          <Flexbox className="font-size-2">
            <Link to={hrefPresentationSession('list')}>↩</Link>
          </Flexbox>
          <Flexbox>
            <Title className="no-margin color-darkblue">
              Live Session 📹🎤
            </Title>
          </Flexbox>
          <Flexbox>
          </Flexbox>
        </Flexbox>
      </StyledWell>);
    }

    return <span />;
  }
}