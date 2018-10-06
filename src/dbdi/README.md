
# DBDI - **D**ata**B**inding via **D**ependency **I**njection

# Intro

DBDI (short for DataBinding via Dependency Injection) allows to easily data-bind any `DataProvider` (e.g. a database, file-system, cache etc.) in with React components. I had this idea after I felt disappointed by other modules that are supposed to deliver React and Redux data-binding for firebase. (Don't get me wrong, I really liked [react-redux-firebase](https://github.com/prescottprue/react-redux-firebase) initially and it is a bit of an inspiration for this project. Its main author, Scott, has been working hard on the project. But due to the overwhelming demand for basic features, advanced features that would not just easily provide data but also ensures that it does the least amount of overhead to get that data (both in terms of performance and loc) were missing.)

Data-binding in DBDI is done via [ES6 proxies](https://ponyfoo.com/articles/es6-proxies-in-depth): A customized `render` function receives several proxies to easily access data nodes that have been defined on the data tree that is provided via React context.

DBDI currently supports two kinds of `DataProviders`:

1. [FirebaseDataProvider](https://github.com/Domiii/project-empire/blob/master/src/dbdi/firebase/FirebaseDataProvider.js) provides CRUD for a firebase backend.
1. [MemoryDataProvider](https://github.com/Domiii/project-empire/blob/master/src/dbdi/dataProviders/MemoryDataProvider.js) stores data in a JS object. This kind of data will be gone when page is reloaded. It is mostly used as a cache for remote APIs, which can be called in the asynchronously treated `fetch` function in the tree definition.

WARNING: Since only I currently use this for my own application prototypes, there is not quite a lot of documentation or testing in it YET.


The idea is simple:

1. Create a backend access configuration in form of a tree (`DataSourceTree`) of data accessors (functions that [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (create, read, update, delete) data).

1. Easily make use of any data accessor (reader or writer) by name in any `render` function or `functional component`.

1. Let `dbdi` take care of all data loading, view refreshing and dependency management automatically (but with options to customize). It also injects a nicely wrapped version of the data access tree into any React component and it's entire sub-tree (via React context).


# Basic Example

Given a tree containing a `currentUser` node with two data children `name` and `age`, we can render and manipulate data like in the following example:


```js
@dataBind({
  /**
   * Click handler used by "Add year" button in component.
   * NOTE: dataBind parameters are injected after caller arguments.
   */
  clickAddYear(evt, // ignore the click event argument
    {}, // props
    { update_currentUser }, // injected reader + writer functions
    { currentUser } // injected data (reader of name is called without arguments)
  ) {
    return update_currentUser(currentUser.age+1);
  }
})
function CurrentUserInfo(
  { clickAddYear }, // props + custom arguments passed to @dataBind
  { }, // injected reader + writer functions
  { currentUser } // injected data (reader of given name is called without arguments)
) {
  if (!currentUser) {
    return (<Alert bsStyle="danger">
      You are not logged in!
    </Alert>)
  }
  else {
    return (<Alert bsStyle="info">
      <p>
        Your name is: {currentUser.name}
      </p>
      <p>
        Your age is: {currentUser.age} 
        <Button onClick={clickAddYear}>Add a year!</Button>
      </p>
    </Alert>);
  }
}

@dataBind()
function ProfilePage(
  { }, // props + custom arguments passed to @dataBind
  { }, // injected reader + writer functions
  { currentUser_isLoaded } // injected data
) {
  if (!currentUser_isLoaded) {
    return (<Loading />);
  }

  return (
    <Panel bsStyle="primary">
      <Panel.Heading>
        Your Profile
      </Panel.Heading>
      <Panel.Body>
        <CurrentUserInfo />
      </Panel.Body>
    </Panel>
  );
}

export default ProfilePage;
```

## Basic Example NOTES

1. `update_currentUser`, `currentUser_isLoaded` and many other utility accessors are automatically created and provided.
1. Data definitions can also contain variables (most commonly used for `ids`) which can also be easily provided by name to a call to the giving data reader.
1. If the data is defined on a remote `DataProvider` (e.g. the `FirebaseDataProvider`), then initially `currentUser_isLoaded` will return false and `currentUser` is null. However trying to read any data will automatically start reading from the remote end, and the component will be re-rendered once the data arrived.


TODO: Many more detailed required.



# More Implementation Notes

1. Since `firebase` is a real-time database, `dbdi` (via the `@dataBind` decorator) conviniently listens for any changes to any data that has been accessed for as long as the component that requested the data is still mounted. The event listener will be removed and data unloaded on unmount.
1. Unlike other modules I tried, `dbdi` will only ever load and listen on any data path once, no matter how many components access it, thereby reducing some overhead. (In early tests, IIRC, I found that `firebase`' [Reference.on("value", ...)](https://firebase.google.com/docs/reference/js/firebase.database.Reference#on) data listener would fetch remote data multiple times when called in quick succession, triggered by different components.)
1. There are many more features, including simple plugins (e.g. the `updatedAt` and `createdAt` `onWrite` plugins) and basic many-to-many relationships (still in development).


# Advanced Example

1. DBDI also provides "fetch and cache", which, when used in `MemoryDataProvider` nodes, can allow for data-binding any remote API. The [YtResourceModel's `ytMyChannels`](https://github.com/Domiii/project-empire/blob/aac9dfbe6d22b2f9495af927e6107cacc88b1c80/src/core/multimedia/youtube/YtResourceModel.js#L32) data node gives an example of how to easily fetch YouTube data through the YouTube API which, thanks to DBDI, gets cached automatically and is available through the same data injection schema as any other data.
1. The [DataRelationshipGraph test](https://github.com/Domiii/project-empire/blob/master/src/dbdi/__tests__/DataRelationshipGraph.test.js) shows some parts of how many-to-many relationships should work (close to feature-complete).


# Unsorted notes
### Some (possible) limitations
* Does not play well with `react-autobind`
  * See: https://blog.andrewray.me/react-es6-autobinding-and-createclass/
  * Recommended solution: use lambda expressions instead
  * Note: [`autobind-decorator`](https://github.com/andreypopp/autobind-decorator) is untested
