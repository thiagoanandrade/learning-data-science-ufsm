library(ggplot2)


f_new <- function(x, a, b) {
  term1 <- (2 * a * b * x^(a - 1)) / (sqrt(pi) * (1 - x^a)^(b + 1))
  term2 <- exp(-((1 - (1 - x^a)^b) / (1 - x^a)^b)^2)
  return(term1 * term2)
}


x_vals <- seq(0.001, 0.9999, by = 0.0001)


a_b_pairs <- expand.grid(a = c(0.9, 2.5, 3.5), b = c(0.9, 2, 3))


cores <- c("tomato3", 
           "pink4", 
           "lightslateblue",
           "#E69F00", 
           "indianred1",
           "darkseagreen4",
           "gray2", 
           "lightgreen",
           "#8DD3C7",
           "#FFFFB1",
           "#FF7F50",  
           "#4682B4")  

# Gerando os dados
df <- data.frame(x = rep(x_vals, times = nrow(a_b_pairs)),
                 a = rep(a_b_pairs$a, each = length(x_vals)),
                 b = rep(a_b_pairs$b, each = length(x_vals)))

df$y <- mapply(f_new, x = df$x, a = df$a, b = df$b)


df$label <- factor(with(df, paste("a =", a, ", b =", b)))


if (length(unique(df$label)) > length(cores)) {
  warning("Existem mais combinações de a e b do que cores disponíveis. Algumas cores serão reutilizadas.")
  cores <- rep(cores, length.out = length(unique(df$label)))
}

# Criando o gráfico
p <- ggplot(df, aes(x = x, y = y, group = label, color = label)) +
  geom_line(linewidth = 1.3) +
  scale_color_manual(values = cores) +
  labs(
    x = "x",
    y = "f(x)",
    color = "Parameters"
  ) +
  theme_gray() +
  ylim(0, 4.2)+
  theme(legend.text = element_text(size = 15)) 


print(p)


 