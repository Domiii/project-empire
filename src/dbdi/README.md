
# DBDI - **D**ata**B**inding via **D**ependency **I**njection

# Intro

I wrote DBDI to easily databind a firebase backend into my React frontends.

The idea is simple:

1. Create a backend access configuration with a tree-like structure (`DataSourceTree`) of data accessors (functions that [CRUD](https://en.wikipedia.org/wiki/Create,_read,_update_and_delete) (create, read, update, delete) data).

2. Inject that configuration into any React component and it's entire sub-tree (which happens via React context).

3. Easily make use of any data accessor in any `render` function or `functional component` by name to read/write data very easily.

4. Let `dbdi` take care of all data loading and dependency management automatically (but with option to customize).


# Basic Example




# More about the DataSourceTree




# Advanced Example




# Unsorted notes
### Some (possible) limitations
* Does not play well with `react-autobind`
  * See: https://blog.andrewray.me/react-es6-autobinding-and-createclass/
  * Recommended solution: use lambda expressions instead
  * Note: [`autobind-decorator`](https://github.com/andreypopp/autobind-decorator) is untested