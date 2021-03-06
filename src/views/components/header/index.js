import Roles, { hasDisplayRole } from 'src/core/users/Roles';

import React, { Component, Fragment as F } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import { dataBind } from 'dbdi/react';

import { Link } from 'react-router-dom';


import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem, Button, ButtonGroup, Alert
} from 'react-bootstrap';
import {
  LinkContainer
} from 'react-router-bootstrap';

import LoadIndicator from 'src/views/components/util/LoadIndicator';
import FAIcon from 'src/views/components/util/FAIcon';
import { PresentationStatus } from '../../../core/presentations/PresentationModel';

class NavWrap extends Component {
  static propTypes = {
    children: PropTypes.object
  };

  render() {
    const {
      active,
      activeKey,
      activeHref,
      onSelect,

      children,

      ...otherProps
    } = this.props;
    return (<li role="presentation" {...otherProps}>
      {children}
    </li>);
  }
}


const CurrentCohortInfo = dataBind()(function CurrentCohortInfo(
  { },
  { cohortName },
  { currentUserCohortId: cohortId }
) {
  if (!cohortId) {
    return '';
  }

  const name = cohortName({ cohortId })

  return (<Navbar.Text>
    {name}
  </Navbar.Text>);
});

const PresentationStatusIcon = dataBind()(function PresentationStatusIcon(
  { },
  { presentationSessionActivePresentationId, get_presentationStatus },
  { livePresentationSessionId }
) {
  if (!livePresentationSessionId) return <span />;

  const sessionArgs = { sessionId: livePresentationSessionId };
  const presentationId = presentationSessionActivePresentationId(sessionArgs);
  if (!presentationId) return <span />;

  const status = get_presentationStatus({ presentationId });
  const isInProgress = status === PresentationStatus.InProgress;

  return (
    <FAIcon className={isInProgress && 'slow-blink' || ''}
      name="microphone"
      color={isInProgress && 'red' || 'gray'} />
  );
});

@dataBind({

})
export default class Header extends Component {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static propTypes = {
    signOut: PropTypes.func.isRequired
  };

  constructor(...args) {
    super(...args);

    this.dataBindMethods(
      this.switchToEn,
      this.switchToZh,
      this.toggleAdminView
    );

    autoBind(this);
  }

  gotoGit = (evt) => {
    this.openInNewTab(evt, 'https://github.com/Domiii/project-empire');
  }

  openInNewTab(evt, url) {
    evt.preventDefault();
    /* global window */
    window.open(url, '_blank');
  }

  switchToEn(evt, { }, { set_userLocale }, { currentUid }) {
    set_userLocale({ uid: currentUid }, 'en');
  }

  switchToZh(evt, { }, { set_userLocale }, { currentUid }) {
    set_userLocale({ uid: currentUid }, 'zh');
  }

  toggleAdminView(evt, { }, { setAdminDisplayMode }, { isCurrentUserAdmin, currentUid }) {
    setAdminDisplayMode({ enabled: !isCurrentUserAdmin, uid: currentUid });
  }

  render(
    { signOut },
    { },
    { currentUid, currentUser, currentUser_isLoaded,
      isCurrentUserAdmin, isCurrentUserAdminReal, isCurrentUserComplete }
  ) {
    //const isGuardian = hasDisplayRole(currentUserRef, Roles.Guardian);
    const lang = currentUser && currentUser.locale || 'en';

    // tools

    const adminToolsEL = isCurrentUserAdminReal && (
      <NavItem className="header-right">
        <Button
          onClick={this.toggleAdminView}
          bsStyle={isCurrentUserAdmin && 'success' || 'danger'}
          className="header-gavel-button"
          active={isCurrentUserAdmin}>
          <FAIcon name="gavel" />
        </Button>
        <span className="padding-half" />
      </NavItem>
    );

    let userToolsEl;
    if (!currentUser_isLoaded) {
      userToolsEl = (<NavItem className="header-right"><LoadIndicator /></NavItem>);
    }
    else {
      userToolsEl = !currentUser ? null : (
        <NavItem className="header-right">
          <ButtonGroup>
            <Button active={lang === 'en'} onClick={this.switchToEn} bsSize="small">
              EN
            </Button>
            <Button active={lang === 'zh'} onClick={this.switchToZh} bsSize="small">
              中文
            </Button>
          </ButtonGroup>
        </NavItem>
      );
    }

    const profileEl = (isCurrentUserComplete && (
      <LinkContainer key="user-profile" to={'/user/' + currentUid}>
        <MenuItem>
          <span>
            {
              currentUser.photoURL &&
              <img src={currentUser.photoURL} style={{ width: '2em' }} /> ||
              <FAIcon name="user" />
            }
            <span className="padding-half" />
            {currentUser.displayName || '<unnamed user>'}
          </span>
        </MenuItem>
      </LinkContainer>)
    );

    // let warningEl;

    // if (router.location.pathname === '/submissions') {
    //   warningEl = (
    //     <Alert bsStyle="danger">
    //       This page suffers from data inconsistency when clicking buttons/links.
    //       Open links in new window instead.
    //     </Alert>
    //   );
    // }

    // pages

    const adminEls = isCurrentUserAdmin && [
      (
        <NavWrap key="divider1" className="divider-vertical" />
      ),
      (
        <LinkContainer key="projects" to="/projects">
          <NavItem eventKey={11}>Projects</NavItem>
        </LinkContainer>
      ),
      (
        <LinkContainer key="video" to="/video">
          <NavItem eventKey={12}>
            Video
          </NavItem>
        </LinkContainer>
      ),
      // (
      //   <LinkContainer key="learnerstatus" to="/learnerstatus">
      //     <NavItem eventKey={11}>Learner Status</NavItem>
      //   </LinkContainer>
      // ),
      // (
      //   <LinkContainer key="kb" to="/kb">
      //     <NavItem eventKey={12}>KB</NavItem>
      //   </LinkContainer>
      // ),
      (
        <LinkContainer key="gm" to="/gm">
          <NavItem eventKey={13}>GM Tools</NavItem>
        </LinkContainer>
      ),
      (
        <LinkContainer key="dev" to="/dev">
          <NavItem eventKey={14}>Dev</NavItem>
        </LinkContainer>
      ),
      // (
      //   <LinkContainer key="places" to="/places">
      //     <NavItem eventKey={14}>Places</NavItem>
      //   </LinkContainer>
      // )
    ];

    return (<div>
      {/* {warningEl} */}
      <header className="header">
        <Navbar inverse collapseOnSelect className="no-margin">
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/"><span>Home</span></Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse className="no-padding no-margin">
            <Nav>
              <NavWrap key="divider1" className="divider-vertical" />
              <CurrentCohortInfo />
              <LinkContainer key="pres" to="/pres">
                <NavItem eventKey={10}>
                  Presentations <PresentationStatusIcon />
                </NavItem>
              </LinkContainer>
              {/* { <LinkContainer to="/myprojects">
                <NavItem eventKey={2}>My Projects</NavItem>
              </LinkContainer>
              }
              { <LinkContainer to="/projects">
                <NavItem eventKey={3}>All Projects</NavItem>
              </LinkContainer>
              }
              <LinkContainer to="/missions">
                <NavItem eventKey={3}>Missions</NavItem>
              </LinkContainer> */}
              {adminEls}
            </Nav>
            <Nav pullRight className="header-right-container">
              {adminToolsEL}
              {userToolsEl}
              <NavDropdown eventKey="more-drop" className="no-margin-right"
                id="user-dropdown" title={<FAIcon name="bars" />}>
                {profileEl}
                {!!currentUser && <MenuItem divider />}
                <MenuItem eventKey="more-drop-sand" onClick={this.gotoGit}>
                  <FAIcon name="github" /> View Source Code
                </MenuItem>
                {!!currentUser && <MenuItem divider />}
                {!!currentUser && (
                  <MenuItem eventKey="user-drop-logout" onClick={signOut}>
                    <FAIcon name="close" className="color-red" /> Sign Out
                  </MenuItem>)
                }
                <LinkContainer key="debug" to="/debug"><MenuItem>
                  <span><FAIcon name="cogs" /> Debug</span>
                </MenuItem></LinkContainer>
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </header>
    </div>);
  }
}