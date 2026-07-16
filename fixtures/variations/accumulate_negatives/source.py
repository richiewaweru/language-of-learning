def net_change(deltas):
    balance = 0
    for d in deltas:
        balance = balance + d
    return balance
