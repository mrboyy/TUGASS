<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Stok extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_stok';

    protected $fillable = [
        'id_barang',
        'nomor_lot',
        'jumlah',
        'tanggal_transaksi',
        'jenis_transaksi',
    ];

    protected $casts = [
        'tanggal_transaksi' => 'date',
    ];

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang', 'id_barang');
    }
}
