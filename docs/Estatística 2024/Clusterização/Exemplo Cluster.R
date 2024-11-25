library(tidyverse)
library(tidymodels)

mall_customers <- read_xls("Mall_Customers.xlsx")
dados1 <- Mall_Customers |> 
            select(-CustomerID,-Genre)

dados1 |> 
  ggplot( aes(x=`Annual Income (k$)`,
              y=`Spending Score (1-100)`)  )+
  geom_point()

panelinha <- kmeans(dados1,centers = 8   )

dados2 <- panelinha |> 
          augment(dados1) |> view()

dados2 |> 
  ggplot( aes(x=`Annual Income (k$)`,
              y=`Spending Score (1-100)`,
              color=.cluster)  )+
  geom_point()


