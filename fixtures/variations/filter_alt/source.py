def positive_prices(prices):
    results = []

    for price in prices:
        if price > 0:
            results.append(price)

    return results
