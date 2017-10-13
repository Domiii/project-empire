import Roles, { hasDisplayRole } from 'src/core/users/Roles';

import React, { PropTypes, PureComponent } from 'react';
import { connect } from 'redux';
import autoBind from 'react-autobind';

import dataBind from 'src/dbdi/react/dataBind';

import { Link } from 'react-router';


import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem, Button, ButtonGroup, Alert
} from 'react-bootstrap';
import {
  LinkContainer
} from 'react-router-bootstrap';

import Loading from 'src/views/components/util/loading';
import { FAIcon } from 'src/views/components/util';


@dataBind({

})
export default class Header extends PureComponent {
  static contextTypes = {
    router: PropTypes.object.isRequired
  };

  static propTypes = {
    signOut: PropTypes.func.isRequired
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }

  gotoProfile() {
    const { currentUid } = this.props.dataInject;
    const { router } = this.context;
    if (currentUid) {
      router.replace('/user/' + currentUid);
    }
  }

  gotoSubmissions(evt) {
    this.openInNewTab(evt, '/submissions');
  }

  gotoGit(evt) {
    this.openInNewTab(evt, 'https://github.com/Domiii/project-empire');
  }

  openInNewTab(evt, url) {
    evt.preventDefault();
    window.open(url, '_blank');
  }

  switchToEn() {
    const { currentUserRef } = this.context;
    currentUserRef.set_userLocale('en');
  }

  switchToZh() {
    const { currentUserRef } = this.context;
    currentUserRef.set_locale('zh');
  }

  toggleAdminView() {
    const { currentUserRef } = this.context;
    currentUserRef.setAdminDisplayMode(!currentUserRef.isAdminDisplayMode());
  }

  render({ }, {}, 
      {currentUid, currentUser, isCurrentUserAdmin, isCurrentUserAdminDisplayRole}) {

    //console.log('header');
    const { router } = this.context;
    const { signOut } = this.props;

    const isLoading = currentUser.isLoaded();
    const isAdminView = isCurrentUserAdminDisplayRole() || false;
    //const isGuardian = hasDisplayRole(currentUserRef, Roles.Guardian);
    const lang = currentUser && currentUser.userLocale || 'en';

    // elements
    const adminToolsEL = isCurrentUserAdmin && (
      <NavItem className="header-right">
        <Button onClick={this.toggleAdminView} bsStyle={isAdminView && 'success' || 'danger'}
          className="header-gavel-button"
          active={isAdminView}>
          <FAIcon name="gavel" />
        </Button>
        <span className="padding-half" />
      </NavItem>
    );

    let userToolsEl;
    if (isLoading) {
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
      <MenuItem eventKey="user-drop-profile">
        <Link to={'/user/' + currentUid}>
          <span>
            {
              currentUser.photoURL &&
              <img src={currentUser.photoURL} style={{ width: '2em' }} /> ||
              <FAIcon name="user" />
            }
            <span className="padding-half" />
            {currentUser.displayName || '<unnamed user>'}
          </span>
        </Link>
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

    return (<div>
      {/* {warningEl} */}
      <header className="header">
        <Navbar inverse collapseOnSelect className=" no-margin">
          <Navbar.Header>
            <Navbar.Brand>
              <Link to="/" onlyActiveOnIndex={true}><span>Home</span></Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              <LinkContainer to="/mymissions">
                <NavItem eventKey={2}>My Projects</NavItem>
              </LinkContainer>
              <LinkContainer to="/projects">
                <NavItem eventKey={3}>All Projects</NavItem>
              </LinkContainer>
              {isAdminView &&
                <LinkContainer to="/gm">
                  <NavItem eventKey={4}>GM Tools</NavItem>
                </LinkContainer>
              }
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
