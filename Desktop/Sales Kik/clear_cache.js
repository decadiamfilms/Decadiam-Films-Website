
console.log('Before clearing localStorage:');
console.log('Customers:', localStorage.getItem('saleskik-customers')); 
localStorage.removeItem('saleskik-customers');
localStorage.removeItem('saleskik-quotes');
console.log('After clearing - customers:', localStorage.getItem('saleskik-customers'));
location.reload();

