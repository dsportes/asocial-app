<template>
  <div :class="'q-my-xs col items-start ' + dkli(idx)">
    <div v-if="ntf" class="row justify-between">
      <div>
        <span class="fs-md q-mr-sm">{{$t(estTribu ? 'NTtr' : 'NTco', [emet])}}</span> 
        <notif-ico :gravite="ntf.g || 1"/>
      </div>
      <div>
        <span class="fs-sm q-mr-xs">{{dh}}</span>
        <q-btn v-if="edit" size="sm" dense icon="edit" color="primary" @click="editer"/>
      </div>
    </div>
    <show-html v-if="ntf" class="q-my-xs bord" :idx="idx" zoom maxh="3rem" :texte="ntf.txt"/>
    <div v-if="!ntf">
      <span class="titre-sm q-mr-sm">{{$t((sponsor ? 'NTnsp' : 'NTnco') + (estTribu ? 'tr' : ''))}}</span> 
      <q-btn v-if="edit" size="sm" dense icon="add" color="primary" :label="$t('NTecr')" @click="editer"/>
    </div>

  <q-dialog v-model="edntf" persistent>
    <q-card class="petitelargeur">
      <q-toolbar>
        <q-btn dense size="md" color="warning" icon="close" @click="close"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t(estTribu ? 'NTtr2' : 'NTco2')}}</q-toolbar-title>
        <notif-ico class="q-mx-xs" :gravite="g"/>
        <bouton-help page="page1"/>
      </q-toolbar>
      <div class="q-mt-sm q-pb-md q-gutter-md row justify-center full-width">
        <q-radio dense v-model="g" :val="1" :label="$t('NT1')" />
        <q-radio dense v-model="g" :val="2" :label="$t('NT2')" />
        <q-radio dense v-model="g" :val="3" :label="$t('NT3')" />
      </div>
<!--  props: { lgmax: Number, modelValue: String, texte: String, labelOk: String, editable: Boolean, idx: Number, modetxt: Boolean, horsSession: Boolean },
-->
      <editeur-md style="height:50vh" :lgmax="1000" editable :texte="txt"
        :label-ok="$t('valider')" modetxt @ok="valider"/>
    </q-card>
  </q-dialog>
  </div>
</template>
<script>

import { encode } from '@msgpack/msgpack'

import stores from '../stores/stores.mjs'
import { dhcool } from '../app/util.mjs'
import { Tribu, getCle } from '../app/modele.mjs'
import ShowHtml from './ShowHtml.vue'
import EditeurMd from './EditeurMd.vue'
import BoutonHelp from './BoutonHelp.vue'
import NotifIco from './NotifIco.vue'
import { crypter } from '../app/webcrypto.mjs'
import { SetAttributTribu } from '../app/operations.mjs'

export default {
  name: 'ApercuNotif',

  props: { src: Object, sponsor: Boolean, idx: Number, edit: Boolean },

  components: { ShowHtml, EditeurMd, BoutonHelp, NotifIco },

  computed: { 
    ntf () { return this.src[this.sponsor ? 'notifsp' : 'notifco'] },
    dh () { return this.ntf && this.ntf.dh ? dhcool(this.ntf.dh) : '' },
    estTribu () { return this.src instanceof Tribu },
    emet () { 
      if (this.ntf.sp) {
        const nsp = getNg(this.ntf.sp)
        return nsp ? nsp.nomc : this.$t('NTunsp')
      }
      return this.cfg.nomDuComptable
    },
  },

  data () { return {
    edntf: false,
    g: 0,
    txt: 0
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    close () { this.edntf = false },
    async editer () {
      if (this.ntf) { 
        this.g = this.ntf.g || 1; this.txt = this.ntf.txt || ''
      } else { this.g = 1; this.txt = '' }
      this.edntf = true
    },
    async valider (txt) {
      const e = { dh: new Date().getTime(), g: this.g, txt: txt, 
        id: this.session.estComptable ? 0 : this.session.compteId }
      // crypté par la clé de la tribu si source tribu, du compte si source compte
      const buf = await crypter(getCle(this.src.id), new Uint8Array(encode(e)))
      await new SetAttributTribu().run(this.src.id, this.sponsor ? 'notifsp' : 'notifco', buf, this.g)
      this.close()
    }
  },

  setup (props) {
    const session = stores.session
    const cfg = stores.config

    return {
      cfg,
      session
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 1px solid $grey-5
</style>
