import React from 'react';
import { span } from 'react-dom';

import PropTypes from 'prop-types';


import {
  Alert
} from 'react-bootstrap';
import FAIcon from 'src/views/components/util/FAIcon';
import LoadIndicator from 'src/views/components/util/LoadIndicator';

const Status = {
  LOADING: 'loading',
  LOADED: 'loaded',
  FAILED: 'failed',
};


export default class ImageLoader extends React.Component {
  static propTypes = {
    className: PropTypes.string,
    style: PropTypes.object,
    preloader: PropTypes.func,
    src: PropTypes.string,
    title: PropTypes.string,
    onLoad: PropTypes.func,
    onError: PropTypes.func,
    imgProps: PropTypes.object,
    children: PropTypes.oneOfType([
      PropTypes.object,
      PropTypes.string,
    ])
  };

  constructor(props) {
    super(props);
    this.state = { status: Status.LOADING };
  }

  componentDidMount() {
    if (this.state.status === Status.LOADING) {
      this.createLoader();
    }
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.src !== nextProps.src) {
      this.setState({
        status: Status.LOADING
      });
    }
  }

  componentDidUpdate() {
    if (this.state.status === Status.LOADING && !this.img) {
      this.createLoader();
    }
  }

  componentWillUnmount() {
    this.destroyLoader();
  }

  getClassName() {
    let className = `imageloader ${this.state.status}`;
    if (this.props.className) className = `${className} ${this.props.className}`;
    return className;
  }

  createLoader() {
    this.destroyLoader(); // We can only have one loader at a time.

    this.img = new Image();
    this.img.onload = this.handleLoad;
    this.img.onerror = this.handleError;
    this.img.src = this.props.src;
  }

  destroyLoader() {
    if (this.img) {
      this.img.onload = null;
      this.img.onerror = null;
      this.img = null;
    }
  }

  handleLoad = (event) => {
    this.destroyLoader();
    this.setState({ status: Status.LOADED });

    if (this.props.onLoad) this.props.onLoad(event);
  }

  handleError = (error) => {
    this.destroyLoader();
    this.setState({ status: Status.FAILED });

    const {
      src
    } = this.props;
    console.error('Unable to load image at URL: ' + src || '<missing img url>');

    if (this.props.onError) this.props.onError(error);
  }

  renderImg(otherTitle) {
    let { src, style, className, preloader, children, title, ...imgProps } = this.props;
    let props = { src, title: title || otherTitle };
    return <img {...props} {...imgProps} style={style} className={className} />;
  }

  render() {
    const {
      children,
      preloader
    } = this.props;

    const Preloader = preloader || LoadIndicator;

    switch (this.state.status) {
      case Status.LOADED:
        return this.renderImg();

      case Status.FAILED:
        return this.renderImg(' ?');    // show the default broken image
      // return (<span>{children || 
      //   <Alert bsStyle="danger" className="inline no-margin no-padding">
      //     <FAIcon name="exclamation-triangle" />
      //     invalid URL
      //   </Alert>
      // }</span>);

      default:
        return <Preloader />;
    }
  }
}