import React, { PropTypes, PureComponent } from 'react';
import { connect } from 'redux';
import autoBind from 'react-autobind';
import { Link } from 'react-router';

import {
  Navbar, Nav, NavItem, NavDropdown, MenuItem, Button, ButtonGroup, Alert
} from 'react-bootstrap';
import {
  LinkContainer
} from 'react-router-bootstrap';

import { FAIcon } from 'src/views/components/util';

import Roles from 'src/core/users/Roles';

export default class Header extends PureComponent {
  static contextTypes = {
    router: PropTypes.object.isRequired,
    currentUserRef: PropTypes.object
  };

  static propTypes = {
    signOut: PropTypes.func.isRequired
  };

  constructor(...args) {
    super(...args);

    autoBind(this);
  }


  gotoProfile() {
    const { router } = this.context;
    router.replace('/user');
  }

  gotoSubmissions(evt) {
    this.openInNewTab(evt, '/submissions');
  }

  gotoGit(evt) {
    this.openInNewTab(evt, 'https://github.com/Domiii/project-empire');
  }

  openInNewTab(evt, url) {
    evt.preventDefault();
    window.open(url,'_blank');
  }

  switchToEn() {
    const { currentUserRef } = this.context;
    currentUserRef.set_locale('en');
  }

  switchToZh() {
    const { currentUserRef } = this.context;
    currentUserRef.set_locale('zh');
  }

  toggleAdminView() {
    const { currentUserRef } = this.context;
    currentUserRef.setAdminDisplayMode(!currentUserRef.isAdminDisplayMode());
  }

  render() {
    //console.log('header');
    const { router, currentUserRef } = this.context;
    const { signOut } = this.props;

    const isAdminView = currentUserRef && currentUserRef.isAdminDisplayMode();
    const isGuardian = currentUserRef && currentUserRef.role() >= Roles.Guardian;
    const isLoading = !currentUserRef || !currentUserRef.isLoaded;
    const userData = currentUserRef && currentUserRef.data();
    const lang = currentUserRef && currentUserRef.locale() || 'en';

    // elements
    const adminToolsEL = (!currentUserRef || !currentUserRef.isAdmin()) ? null : (
      <NavItem className='header-right'>
        <Button onClick={this.toggleAdminView} bsStyle={isAdminView && 'success' || 'danger'}
          className="header-gavel-button"
          active={isAdminView}>
          <FAIcon name="gavel"/>
        </Button>
        <span className="padding-half" />
      </NavItem>
    );

    const userToolsEl = (!currentUserRef || !currentUserRef.val) ? null : (
      <NavItem className='header-right'>
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

    const profileEl = (userData && 
      <MenuItem eventKey="user-drop-profile" onClick={this.gotoProfile}>
        <span>
          {
            userData.photoURL &&
            <img src={userData.photoURL} style={{width: '2em'}} /> ||
            <FAIcon name="user" />
          }
          <span className="padding-half" />
          {userData.displayName || userData.email}
        </span>
      </MenuItem>
    );

    let warningEl;

    if (router.location.pathname === '/submissions') {
      warningEl = (
        <Alert bsStyle="danger">
          This page suffers from data inconsistency when clicking buttons/links.
          Open links in new window instead.
        </Alert>
      );
    }

    return (<div>
      { warningEl }
      <header className="header">
        <Navbar inverse collapseOnSelect className="no-margin">
          <Navbar.Header>
            <Navbar.Brand>
              <Link to='/' onlyActiveOnIndex={true}><span>Home</span></Link>
            </Navbar.Brand>
            <Navbar.Toggle />
          </Navbar.Header>
          <Navbar.Collapse>
            <Nav>
              <LinkContainer to='/missionControl'>
                <NavItem eventKey={2}>Mission Control</NavItem>
              </LinkContainer>
              { isGuardian &&
                <LinkContainer to='/guardians'>
                  <NavItem eventKey={3}>Guardians</NavItem>
                </LinkContainer>
              }
              { isAdminView &&
                <LinkContainer to='/gm'>
                  <NavItem eventKey={4}>GM Tools</NavItem>
                </LinkContainer>
              }
            </Nav>
            <Nav pullRight className="header-right-container">
              { adminToolsEL }
              { userToolsEl }
              <NavDropdown eventKey="more-drop" id="user-dropdown" title={
                   <FAIcon name="cog" />
                }>
                { profileEl }
                { !!userData && <MenuItem divider /> }
                <MenuItem eventKey="more-drop-sand" onClick={ this.gotoGit }>
                 <FAIcon name="github" /> View Source Code
                </MenuItem>
                { !!userData && <MenuItem divider /> }
                { !!userData && (
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
};
