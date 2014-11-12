# Mapper

This tools generates pre-prendered interactive and/or static map graphics from a data set.

![Mapper](screenshot.png)

# Setup

1) Install Middleman and the app:

```
bundle install middleman
cd mapper
bundle install
```

2) To run the app:

```
cd mapper
bundle exec middleman
```

# Formatting data

Data can be imported in standard CSV format. The tool does support multiple columns of data, and will differentiate between number and string columns.