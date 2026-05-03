"""
Seed Supabase — One-time script
================================
Uploads the original 36 football quiz questions into your Supabase
'questions' table.  Run this ONCE after creating the table.

Usage:
    python3 seed_supabase.py
"""

import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print('❌  Missing SUPABASE_URL or SUPABASE_KEY in .env file.')
    exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# ──────────────────────────────────────────────
# All 36 seed questions
# ──────────────────────────────────────────────

SEED_DATA = [
    # Champions League (4)
    {"question": "Which club has won the most UEFA Champions League titles?",
     "options": ["AC Milan", "Real Madrid", "Barcelona", "Bayern Munich"],
     "correct": 1, "category": "champions-league"},
    {"question": "Who scored the winning goal in the 2017 Champions League final?",
     "options": ["Gareth Bale", "Cristiano Ronaldo", "Karim Benzema", "Sergio Ramos"],
     "correct": 1, "category": "champions-league"},
    {"question": "Which team completed the famous 'Remontada' comeback against PSG in 2017?",
     "options": ["Real Madrid", "Juventus", "Barcelona", "Bayern Munich"],
     "correct": 2, "category": "champions-league"},
    {"question": "In which year did Liverpool win the Champions League in Istanbul with a dramatic comeback?",
     "options": ["2003", "2005", "2007", "2009"],
     "correct": 1, "category": "champions-league"},

    # World Cup (4)
    {"question": "Which country won the 2022 FIFA World Cup in Qatar?",
     "options": ["France", "Brazil", "Argentina", "Croatia"],
     "correct": 2, "category": "world-cup"},
    {"question": "Who holds the record for most FIFA World Cup goals?",
     "options": ["Ronaldo (Brazil)", "Miroslav Klose", "Pelé", "Just Fontaine"],
     "correct": 1, "category": "world-cup"},
    {"question": "Which country has won the most FIFA World Cup titles?",
     "options": ["Germany", "Italy", "Argentina", "Brazil"],
     "correct": 3, "category": "world-cup"},
    {"question": "In which World Cup did Maradona score the 'Hand of God' goal?",
     "options": ["1982 Spain", "1986 Mexico", "1990 Italy", "1994 USA"],
     "correct": 1, "category": "world-cup"},

    # Euro (4)
    {"question": "Which country won UEFA Euro 2020 (played in 2021)?",
     "options": ["England", "Spain", "Italy", "France"],
     "correct": 2, "category": "euro"},
    {"question": "Who scored the winning penalty in the Euro 2020 final shootout for Italy?",
     "options": ["Jorginho", "Bonucci", "Bernardeschi", "England missed — Italy won"],
     "correct": 3, "category": "euro"},
    {"question": "Which country won the first European Championship in 1960?",
     "options": ["Spain", "Soviet Union", "Germany", "Italy"],
     "correct": 1, "category": "euro"},
    {"question": "Greece won Euro 2004. Who did they beat in the final?",
     "options": ["France", "Czech Republic", "Portugal", "Netherlands"],
     "correct": 2, "category": "euro"},

    # Legends (4)
    {"question": "Who is the all-time top scorer in football history (official goals)?",
     "options": ["Lionel Messi", "Pelé", "Cristiano Ronaldo", "Josef Bican"],
     "correct": 2, "category": "legends"},
    {"question": "Which player is known as 'The Phenomenon'?",
     "options": ["Ronaldinho", "Ronaldo Nazário", "Zidane", "Rivaldo"],
     "correct": 1, "category": "legends"},
    {"question": "How many Ballon d'Or awards has Lionel Messi won (as of 2023)?",
     "options": ["6", "7", "8", "5"],
     "correct": 2, "category": "legends"},
    {"question": "Which legendary goalkeeper was called 'The Black Spider'?",
     "options": ["Gordon Banks", "Gianluigi Buffon", "Lev Yashin", "Peter Schmeichel"],
     "correct": 2, "category": "legends"},

    # Records (4)
    {"question": "What is the fastest goal in Premier League history?",
     "options": ["7.69 seconds", "9.11 seconds", "10.54 seconds", "12.02 seconds"],
     "correct": 0, "category": "records"},
    {"question": "Which stadium is 'The Theatre of Dreams'?",
     "options": ["Anfield", "Santiago Bernabéu", "Camp Nou", "Old Trafford"],
     "correct": 3, "category": "records"},
    {"question": "Who holds the record for most international goals?",
     "options": ["Lionel Messi", "Ali Daei", "Cristiano Ronaldo", "Pelé"],
     "correct": 2, "category": "records"},
    {"question": "What is the largest victory margin in a FIFA World Cup match?",
     "options": ["9-0", "10-1", "7-1", "12-0"],
     "correct": 1, "category": "records"},

    # La Liga (8)
    {"question": "Which club has won the most La Liga titles?",
     "options": ["Barcelona", "Atletico Madrid", "Real Madrid", "Valencia"],
     "correct": 2, "category": "la-liga"},
    {"question": "Who is La Liga's all-time top scorer?",
     "options": ["Raúl", "Cristiano Ronaldo", "Lionel Messi", "Telmo Zarra"],
     "correct": 2, "category": "la-liga"},
    {"question": "Which La Liga team is known as 'Los Colchoneros' (The Mattress Makers)?",
     "options": ["Real Betis", "Sevilla", "Atletico Madrid", "Villarreal"],
     "correct": 2, "category": "la-liga"},
    {"question": "In which year did Barcelona complete the historic sextuple under Pep Guardiola?",
     "options": ["2008", "2009", "2010", "2011"],
     "correct": 1, "category": "la-liga"},
    {"question": "Which player scored the fastest hat-trick in La Liga history?",
     "options": ["Lionel Messi", "Cristiano Ronaldo", "Luis Suárez", "Radamel Falcao"],
     "correct": 0, "category": "la-liga"},
    {"question": "What is the name of the derby between Real Madrid and Barcelona?",
     "options": ["Madrid Derby", "Super Clásico", "El Clásico", "La Gran Derbi"],
     "correct": 2, "category": "la-liga"},
    {"question": "Which club won La Liga in the 2020-21 season?",
     "options": ["Real Madrid", "Barcelona", "Atletico Madrid", "Sevilla"],
     "correct": 2, "category": "la-liga"},
    {"question": "Who holds the record for most appearances in La Liga?",
     "options": ["Raúl", "Iker Casillas", "Andoni Zubizarreta", "Sergio Ramos"],
     "correct": 2, "category": "la-liga"},

    # Premier League (8)
    {"question": "Which club has won the most Premier League titles?",
     "options": ["Liverpool", "Arsenal", "Chelsea", "Manchester United"],
     "correct": 3, "category": "premier-league"},
    {"question": "Who is the Premier League's all-time top scorer?",
     "options": ["Wayne Rooney", "Thierry Henry", "Alan Shearer", "Andrew Cole"],
     "correct": 2, "category": "premier-league"},
    {"question": "Which team went unbeaten for an entire Premier League season in 2003-04?",
     "options": ["Manchester United", "Chelsea", "Arsenal", "Liverpool"],
     "correct": 2, "category": "premier-league"},
    {"question": "Leicester City shocked the world by winning the Premier League in which season?",
     "options": ["2014-15", "2015-16", "2016-17", "2013-14"],
     "correct": 1, "category": "premier-league"},
    {"question": "Who has the most Premier League assists of all time?",
     "options": ["Frank Lampard", "David Beckham", "Ryan Giggs", "Cesc Fàbregas"],
     "correct": 2, "category": "premier-league"},
    {"question": "Which player has won the most Premier League Golden Boot awards?",
     "options": ["Alan Shearer", "Thierry Henry", "Mohamed Salah", "Sergio Agüero"],
     "correct": 1, "category": "premier-league"},
    {"question": "Which club won the Premier League title in the 2022-23 season?",
     "options": ["Arsenal", "Manchester City", "Liverpool", "Tottenham"],
     "correct": 1, "category": "premier-league"},
    {"question": "Who scored the famous 'Agüeroooo!' last-minute title-winning goal in 2012?",
     "options": ["Carlos Tevez", "David Silva", "Sergio Agüero", "Mario Balotelli"],
     "correct": 2, "category": "premier-league"},
]


def main():
    print('🚀  Seeding Supabase with 36 football quiz questions...\n')

    # Insert all questions in one batch
    response = supabase.table('questions').insert(SEED_DATA).execute()

    print(f'✅  Successfully inserted {len(response.data)} questions into Supabase!')
    print('\nSample inserted row:')
    print(response.data[0])


if __name__ == '__main__':
    main()