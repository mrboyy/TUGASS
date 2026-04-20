<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barang extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_barang';

    protected $fillable = [
        'nama_barang',
        'merk',
        'kategori',
        'stok_minimum',
    ];

    public function transaksiBarangs()
    {
        return $this->hasMany(TransaksiBarang::class, 'id_barang', 'id_barang');
    }

    public function stoks()
    {
        return $this->hasMany(Stok::class, 'id_barang', 'id_barang');
    }
}
