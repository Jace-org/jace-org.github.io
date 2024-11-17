import matplotlib.pyplot as plt

# Data
respondents = ['A', 'B', 'C', 'D', 'E']
income = [1200000, 900000, 1500000, 1100000, 1300000]
expenditure = [800000, 600000, 1000000, 700000, 900000]
savings = [400000, 300000, 500000, 400000, 400000]

# Plotting the graph
fig, ax = plt.subplots()

bar_width = 0.25
bar1 = ax.bar([i - bar_width for i in range(len(respondents))], income, bar_width, label='Income')
bar2 = ax.bar(range(len(respondents)), expenditure, bar_width, label='Expenditure')
bar3 = ax.bar([i + bar_width for i in range(len(respondents))], savings, bar_width, label='Savings')

# Adding labels and title
ax.set_xlabel('Respondents')
ax.set_ylabel('Amount (Rs.)')
ax.set_title('Income, Expenditure, and Savings of Foreign Employment')
ax.set_xticks(range(len(respondents)))
ax.set_xticklabels(respondents)
ax.legend()

# Adding values on top of bars
def add_values(bars):
    for bar in bars:
        height = bar.get_height()
        ax.text(bar.get_x() + bar.get_width() / 2.0, height, '%d' % int(height), ha='center', va='bottom')

add_values(bar1)
add_values(bar2)
add_values(bar3)

plt.tight_layout()
plt.show()
