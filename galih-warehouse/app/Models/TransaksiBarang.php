<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TransaksiBarang extends Model
{
    use HasFactory;

    protected $primaryKey = 'id_transaksi';

    protected $fillable = [
        'kode_transaksi',
        'id_barang',
        'jenis_transaksi',
        'quantity',
        'tanggal',
        'nomor_lot',
        'keterangan',
    ];

    protected $casts = [
        'tanggal' => 'date',
    ];

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang', 'id_barang');
    }
}
