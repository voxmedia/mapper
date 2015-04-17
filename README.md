# mapper

This tool uses D3 to generate choropleth map graphics based upon a data set. Load in your data, configure your thresholds, and see the map render. This is a proof of concept app not currently in active production. We welcome the editorial communities to use this as a starting point for building great mapping tools. Existing features:

 - Thresholds or heat scale rendering.
 - Outline rendering for select shapes based on data.
 - Basic legend rendering.
 - Export as PNG.
 - Export as SVG (needs some cleanup)
 - Interactive tooltip in preview mode (interactive version needs an export option)

![Mapper](screenshot.png)

## Getting Started

1) Install Middleman and the app:

```
gem install middleman
cd mapper
bundle install
```

2) To run the app:

```
bundle exec middleman
```

## Documentation

### Formatting data

Data can be imported in standard CSV format. The tool does support multiple columns of data, and will differentiate between number and string columns.

## Examples

## Contribute

This is an active project and we encourage contributions. [Please review our guidelines and code of conduct before contributing](https://github.com/voxmedia/open-source-contribution-guidelines).
