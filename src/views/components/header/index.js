import Roles, { hasDisplayRole } from 'src/core/users/Roles';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import { Link } from 'react-router-dom';


import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem, Button, ButtonGroup, Alert
} from 'react-bootstrap';
import {
  LinkContainer
} from 'react-router-bootstrap';

import Loading from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';

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

  gotoSubmissions(evt) {
    this.openInNewTab(evt, '/submissions');
  }

  gotoGit(evt) {
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

  render({ signOut }, { },
    { currentUid, currentUser, currentUser_isLoaded,
      isCurrentUserAdmin, isCurrentUserAdminReal }) {
    //const isGuardian = hasDisplayRole(currentUserRef, Roles.Guardian);
    const lang = currentUser && currentUser.locale || 'en';

    // elements
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
      userToolsEl = (<NavItem className="header-right"><Loading /></NavItem>);
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

    const profileEl = (currentUser &&
      <MenuItem eventKey="user-drop-profile" href={'/user/' + currentUid}>
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

    const adminEls = isCurrentUserAdmin && [
      (
        <NavWrap key="divider1" className="divider-vertical">
        </NavWrap>
      ),
      (
        <LinkContainer key="learnerstatus" to="/learnerstatus">
          <NavItem eventKey={11}>Learner Status</NavItem>
        </LinkContainer>
      ),
      (
        <LinkContainer key="kb" to="/kb">
          <NavItem eventKey={12}>KB</NavItem>
        </LinkContainer>
      ),
      (
        <LinkContainer key="gm" to="/gm">
          <NavItem eventKey={13}>GM Tools</NavItem>
        </LinkContainer>
      ),
      (
        <LinkContainer key="places" to="/places">
          <NavItem eventKey={14}>Places</NavItem>
        </LinkContainer>
      )
    ];

    return (<div>
      {/* {warningEl} */}
      <header className="header">
        <Navbar inverse collapseOnSelect className=" no-margin">
          {/* <Navbar.Header>
            <Navbar.Brand>
              <Link to="/"><span>Home</span></Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header> */}
          <Navbar.Collapse>
            <Nav>
              <LinkContainer to="/myprojects">
                <NavItem eventKey={2}>My Projects</NavItem>
              </LinkContainer>
              <LinkContainer to="/projects">
                <NavItem eventKey={3}>All Projects</NavItem>
              </LinkContainer>
              <LinkContainer to="/missions">
                <NavItem eventKey={3}>Missions</NavItem>
              </LinkContainer>
              {adminEls}
            </Nav>
            <Nav pullRight className="header-right-container">
              {adminToolsEL}
              {userToolsEl}
              <NavDropdown eventKey="more-drop"
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
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
      </header>
    </div>);
  }
}
