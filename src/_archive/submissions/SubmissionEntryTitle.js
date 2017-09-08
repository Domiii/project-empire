import React, { PureComponent, PropTypes } from 'react';
import Moment from 'react-moment';
// import {
//   ListGroup, ListGroupItem, Well
// } from 'react-bootstrap';
import { Link } from 'react-router';
import { FAIcon } from 'src/views/components/util';
import classNames from 'classnames';

import { hrefConceptView } from 'src/views/href';

export default class SubmissionEntryTitle extends PureComponent {
  static propTypes = {
    user: PropTypes.object.isRequired,
    concept: PropTypes.object.isRequired,
    hasSubmitted: PropTypes.bool.isRequired,
    updatedAt: PropTypes.any
  };
  
  static contextTypes = {
    lookupLocalized: PropTypes.func.isRequired
  };

  ConceptEl(conceptId, concept) {
    const {
      lookupLocalized
    } = this.context;

    return (
      <pre style={{display: 'inline', fontSize: '1.2em'}}
        className="margin-half no-padding">
        <Link className="margin"
          to={hrefConceptView(concept.ownerId, conceptId)}>
          {lookupLocalized(concept, 'title')}
        </Link>
      </pre>
    );
  }

  UserEl(uid, user) {
    const iconSize = '2em';

    const name = user && user.data && user.data.displayName || '<unknown>';
    const email = user && user.data && user.data.email || '<unknown>';
    const userIcon = user && user.data &&
      <img style={{maxWidth: iconSize}} src={user.data.photoURL} /> || 
      <FAIcon style={{fontSize: iconSize}} name="user" />;

    return (<span className="submission-user">
      <span className="submission-user-icon">{ userIcon }</span> <span
        className="submission-user-name">{ name }</span> <span
          className="submission-user-email">({ email })</span>
    </span>);
  }

  UpdatedAtEl(timestamp) {
    // return (
    //   <span>hi</span>
    //   (<span>world</span>)
    // );

    return (
      <span>
        <Moment fromNow>{timestamp}</Moment> (
          <Moment format="ddd, MMMM Do YYYY, h:mm:ss a">{timestamp}</Moment>)
      </span>
    );
  }

  render() {
    const {
      user,
      concept,
      hasSubmitted,
      updatedAt
    } = this.props;

    const uid = user.uid;
    const conceptId = concept.conceptId;

    const headingClasses = classNames({
      'list-group-item-heading': true,
      'submission-entry-heading': true
    });

    return (
      <div>
        <h4 className={headingClasses}>
          <span>
            { this.UserEl(uid, user) } submitted{ this.ConceptEl(conceptId, concept) }
          </span>
          <span style={{float: 'right'}}>
            { hasSubmitted &&
              <FAIcon name="check" className="color-green" /> ||  
              <FAIcon name="remove" className="color-red" />
            }
          </span>
        </h4>
        <div>
          { this.UpdatedAtEl(updatedAt) }
        </div>
      </div>
    );
  }
}