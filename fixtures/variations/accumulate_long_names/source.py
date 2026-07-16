def compute_grand_total(invoice_line_amounts):
    grand_total = 0
    for invoice_line_amount in invoice_line_amounts:
        grand_total = grand_total + invoice_line_amount
    return grand_total
