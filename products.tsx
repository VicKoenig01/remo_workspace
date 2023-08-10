function CreatePageProduct() {
  const [products, setProducts] = React.useState<ProductFragment[] | any>([]);

  //получение обычного списка товаров
  const [getAllProd, { loading, data, error, fetchMore }] = useGetProductsLazyQuery({
    variables: {
      organizationId: ORGANIZATION_ID,
      limit: 10,
      offset: 0,
    },
  });

  //поиск товаров (search_Product)
  const [getSearhProd] = useSearhProdLazyQuery();
  
  const [skip, setSkip] = React.useState(10);
  const [hasMore, setHasMore] = React.useState(true);
  const [countProd, setCountProd] = React.useState<number | undefined>(0);
  const [inputSearhBar, setinputSearhBar] = React.useState<string>('');
  const [getAllProducts, setGetAllProducts] = React.useState(true);

  React.useEffect(() => {
    getAllProd({
      variables: {
        organizationId: ORGANIZATION_ID,
        limit: 10,
        offset: 0,
      },
    }).then(({ data }) => {
      if (data) {
        setProducts(data.Product);
        setCountProd(data?.Product_aggregate?.aggregate?.count);
      }
    });  
  }, [data]);

  //подгрузка товаров при скроллинге
  const fetchData = async () => {
    if (getAllProducts) {
      if (products?.length === countProd) {
        setHasMore(false);
      }
      if (hasMore) {
        await fetchMore({
          variables: {
            offset: skip,
          },
          updateQuery: (existing, incoming) => ({
            Product: [...existing.Product, ...incoming.fetchMoreResult.Product],
            Product_aggregate: {
              ...existing.Product_aggregate,
              ...incoming.fetchMoreResult.Product_aggregate,
            },
          }),
        });
        setSkip(skip + 10);
      } else {
        setSkip(10);
      }
    } else {
      if (products?.length === countProd) {
        setHasMore(false);
      }
      if (hasMore) {
        getSearhProd({
          variables: {
            limit: 10,
            offset: skip,
            searhProd: inputSearhBar,
          },
        }).then(({ data }) => {
          if (data) {
            setProducts(products.concat(data.search_Product.products.map((p) => p.data)));
            setSkip(skip + 10);
          }
        });
      }
    }
  };

  //изменения поля Поиск
  const changeSearhBar = async (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setinputSearhBar(event.target.value);
    if (event.target.value !== '' && event.target.value.length >= 3) {     
      getSearhProd({
        variables: {
          limit: 10,
          offset: 0,
          searhProd: event.target.value,
        },
      }).then(({ data }) => {
        if (data) {
          
          setProducts(data.search_Product.products.map((p) => p.data));
          setCountProd(data.search_Product.totalProducts);
          setHasMore(true);
          setSkip(10);
        }
      });
      setGetAllProducts(false);     
    }
    if (event.target.value === '') {
      setHasMore(true);
      setSkip(0);
      setGetAllProducts(true);
      getAllProd().then(({ data }) => {
        if (data) {
          setProducts(data.Product);
          setCountProd(data?.Product_aggregate?.aggregate?.count);
        }
      });
    }
  };

  //клик по кнопке Очистить в поле Поиск
  const clearSearhBar = () => {
    setinputSearhBar('');
    setHasMore(true);
    setSkip(0);
    setGetAllProducts(true);
    getAllProd().then(({ data }) => {
      if (data) {
        setProducts(data.Product);
        setCountProd(data?.Product_aggregate?.aggregate?.count);
      }
    });
  };

  return (
    <>
      <Container maxWidth={themeStretch ? false : 'xl'}>
        <InfiniteScroll
          dataLength={products?.length ?? 0}
          next={fetchData}
          hasMore={hasMore}
          loader={<h4>Загрузка...</h4>}
        >
          <Typography variant="h3" component="h1" paragraph>
            Список товаров
          </Typography>
          <Paper
            component="form"
            sx={{
              p: '2px 4px',
              display: 'flex',
              alignItems: 'center',
              width: 'auto',
              backgroundColor: (theme) => theme.palette.grey[100],
              '--Grid-borderWidth': '1px',
              border: 'var(--Grid-borderWidth) solid',
              borderColor: 'divider',
              borderRadius: '20px',
            }}
            onSubmit={(e) => e.preventDefault()}
          >
            <InputBase
              sx={{
                ml: 1,
                flex: 1,
              }}
              placeholder="Найти товар..."
              onChange={(event) => changeSearhBar(event)}
              value={inputSearhBar}
            />
            <IconButton type="button" sx={{ p: '10px' }} onClick={clearSearhBar}>
              <Clear />
            </IconButton>
          </Paper>

          <Paper
            sx={{
              p: 1,
              margin: 'auto',
              maxWidth: 'auto',
              flexGrow: 1,
              marginTop: '50px',
              backgroundColor: (theme) => (theme.palette.mode === 'dark' ? '#1A2027' : '#fff'),
            }}
          >
            {loading && <p>Загрузка...</p>}
            <Grid container spacing={3} columnSpacing={{ xs: 1, sm: 3, md: 3 }} direction="column">
              {products &&
                products.map((product: any) => (
                  <Grid
                    key={product.id}
                    item
                    xs={12}
                    sm
                    container
                    sx={{
                      '--Grid-borderWidth': '1px',
                      border: 'var(--Grid-borderWidth) solid',
                      borderColor: 'divider',
                      borderRadius: '20px',
                      margin: '5px',
                    }}
                  >
                    <Grid item xs container direction="column" spacing={2}>
                      <Grid item xs>
                        <Typography variant="body2" color="text.secondary">
                          Арт. {product?.articleNumber ?? '-'}
                        </Typography>
                        <Typography gutterBottom variant="subtitle1" component="div">
                          {product?.name ?? '-'}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Остаток: {product?.amountPrice[0]?.amount ?? '0'}{' '}
                          {product?.unit?.simple ?? '-'}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Grid item sx={{ marginRight: '10px' }}>
                      <Typography variant="subtitle1" component="div">
                        {product?.amountPrice[0]?.price ?? '0'}₽
                      </Typography>
                    </Grid>
                  </Grid>
                ))}
            </Grid>
          </Paper>
        </InfiniteScroll>
      </Container>
    </>
  );
}

