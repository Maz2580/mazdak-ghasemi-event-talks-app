import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template
import re

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_content_html(html_content, date_str, base_link):
    if not html_content:
        return []
        
    soup = BeautifulSoup(html_content, 'html.parser')
    items = []
    
    current_type = "Update"
    
    def create_item(item_type, content_soup, index):
        # Convert relative links to absolute links
        for a in content_soup.find_all('a'):
            if a.get('href', '').startswith('/'):
                a['href'] = 'https://docs.cloud.google.com' + a['href']
                
        html_str = "".join([str(c) for c in content_soup.contents]).strip()
        text_str = content_soup.get_text().strip()
        
        # Replace duplicate whitespace/newlines in text
        text_str = re.sub(r'\s+', ' ', text_str)
        
        clean_date = re.sub(r'[^a-zA-Z0-9]', '_', date_str)
        item_id = f"{clean_date}_{item_type.lower()}_{index}"
        
        return {
            'id': item_id,
            'date': date_str,
            'type': item_type,
            'html': html_str,
            'text': text_str,
            'link': base_link
        }
        
    index = 0
    temp_soup = BeautifulSoup("", "html.parser")
    for el in list(soup.contents):
        if el.name == 'h3':
            if len(temp_soup.contents) > 0 and temp_soup.get_text().strip():
                items.append(create_item(current_type, temp_soup, index))
                index += 1
                temp_soup = BeautifulSoup("", "html.parser")
            current_type = el.get_text().strip()
        else:
            temp_soup.append(el)
            
    if len(temp_soup.contents) > 0 and temp_soup.get_text().strip():
        items.append(create_item(current_type, temp_soup, index))
        
    if not items and html_content.strip():
        # Fallback if no <h3> tags were found at all
        text_str = re.sub(r'\s+', ' ', soup.get_text().strip())
        items.append({
            'id': f"{re.sub(r'[^a-zA-Z0-9]', '_', date_str)}_update_0",
            'date': date_str,
            'type': 'Update',
            'html': html_content,
            'text': text_str,
            'link': base_link
        })
        
    return items

def fetch_and_parse_feed():
    try:
        req = urllib.request.Request(
            FEED_URL, 
            headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
        )
        with urllib.request.urlopen(req, timeout=10) as response:
            xml_data = response.read()
        
        root = ET.fromstring(xml_data)
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        for entry in root.findall('atom:entry', ns):
            date_str = entry.find('atom:title', ns).text.strip()
            link_el = entry.find('atom:link', ns)
            link = ""
            if link_el is not None:
                link = link_el.get('href', '')
                
            content_el = entry.find('atom:content', ns)
            content_html = content_el.text if content_el is not None else ""
            
            items = parse_content_html(content_html, date_str, link)
            entries.extend(items)
            
        return {
            'success': True,
            'entries': entries
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/feed')
def get_feed():
    data = fetch_and_parse_feed()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
