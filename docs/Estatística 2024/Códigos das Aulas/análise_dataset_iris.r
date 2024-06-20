library(tidyverse)

data(iris)

ds <- iris
ds |>
  group_by(Species) |>
  summarise(
    across(
      .cols = where(
        is.numeric
      ),
      .fns = list(mean, median, sd, var),
    )
  ) |>
  view()
