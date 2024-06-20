library(rattle)
library(tidyr)
library(tibble)
library(dplyr)

rattle::wine |>
  dplyr::select(Type, Alcohol, Color, Hue) |>
  dplyr::group_by(Type) |>
  dplyr::summarise(
    dplyr::across(
      .cols = c(Alcohol, Color, Hue),
      .fns = c(Média = mean, Mediana = median, Desvio_Padrão = sd, Variância = var),
      .names = "{.fn} {.col}",
      na.rm = TRUE
    )
  ) |>
  tidyr::pivot_longer(
    cols = c(
      starts_with("Média") |
        starts_with("Mediana") |
        starts_with("Desvio_Padrão") |
        starts_with("Variância")
    ),
    names_to = "Medidas",
    values_to = "Valores",
  ) |>
  tibble::view()
