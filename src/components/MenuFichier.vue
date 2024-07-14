<template>
<q-btn dense size="md" round padding="none" icon="more_vert" color="primary">
  <q-menu anchor="bottom left" self="top left" max-height="20rem" 
    max-width="32rem">
    <q-list class="q-py-xs bord1 bg-black text-white fs-md ">
      <q-item clickable v-close-popup  @click="copierFic" class="row items-center">
        <q-icon color="primary" size="md" name="content_copy" />
        <span>{{$t('PNFcop')}}</span>
      </q-item>
      <q-item clickable v-close-popup  @click="affFic" class="row items-center">
        <q-icon color="primary" size="md" name="open_in_new" />
        <span>{{$t('PNFaff')}}</span>
      </q-item>
      <q-item clickable v-close-popup  @click="enregFic" class="row items-center">
        <q-icon color="primary" size="md" name="save" />
        <span>{{$t('PNFenreg')}}</span>
      </q-item>
      <q-item v-if="!simple" :clickable="aut !== 0" v-close-popup  @click="ovSuppr" class="row items-center">
        <q-icon color="warning" size="md" name="delete" />
        <span>{{$t('PNFsuppr')}}</span>
      </q-item>
      <q-item v-if="simple" v-close-popup  clickable @click="voirNote" class="row items-center">
        <q-icon color="primary" size="md" name="open_in_new" />
        <span>{{$t('PNFvoirn')}}</span>
      </q-item>
      <q-item clickable v-close-popup  @click="ouvrirDF" class="row items-center">
        <q-icon color="primary" size="md" name="airplanemode_active" />
        <span>{{$t('PNFdetail')}}</span>
      </q-item>
    </q-list>
  </q-menu>

  <q-dialog v-model="ui.d.DFouvrir[idc]" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')" style="height:70vh">
    <q-header elevated class="bg-secondary text-white">
      <q-toolbar>
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg full-width text-center">
          {{$t('PNOdetail', [f.nom])}}
        </q-toolbar-title>      
        <bouton-help page="page1"/>
      </q-toolbar>
      <q-toolbar v-if="ro" inset class="full-width msg">{{$t('PNOro')}} - {{ro}}</q-toolbar>
    </q-header>

    <q-page-container >
      <q-page class="q-pa-xs">
        <div class="row q-gutter-sm q-my-sm">
          <span v-if="f.info" class="font-mono text-bold">{{f.info}}</span>
          <span class="font-mono">#{{f.idf || '?'}}</span>
          <span>{{f.type || '?'}}</span>
          <span v-if="f.lg">{{edvol(f.lg)}}</span>
          <span v-if="f.dh">{{dhcool(f.dh, true)}}</span>
        </div>

        <div v-if="session.accesIdb" class="q-mx-xs q-my-sm q-pa-xs bord1 items-center">
          <div class="titre-lg">{{$t('DFavion')}}</div>
          <div class="row items-center">
            <div class="col-7 text-right">{{$t('DFavn')}}</div>
            <div :class="'col-1 text-center ' + (avn ? 'msg' : '')">{{$t(avn ? 'oui1' : 'non')}}</div>
            <div class="q-pl-xs">
              <q-toggle :class="'col-4 ' + clr1" indeterminate-value="?" color="grey-5" v-model="xavn" :label="oxn1" />
            </div>
          </div>
          <div class="row items-center">
            <div class="col-7 text-right">{{$t('DFav')}}</div>
            <div :class="'col-1 text-center ' + (av ? 'msg' : '')">{{$t(av ? 'oui1' : 'non')}}</div>
            <div class="q-pl-xs">
              <q-toggle :class="'col-4 ' + clr2" indeterminate-value="?" color="grey-5" v-model="xav" :label="oxn2" />
            </div>
          </div>
          <div class="row q-my-sm justify-end q-gutter-sm items-center">
            <bouton-undo class="col-1 text-center" :cond="modifAv" 
              @click="xavn = '?'; xav = '?'"/>
            <btn-cond :label="$t('valider')" :disable="!modifAv" icon="check" @ok="validerAv"/>
          </div>
        </div>

        <div v-if="!fa.fake" class="q-my-sm bord1"> <!-- Etat du téléchargement -->
          <div v-if="fa.dhdc === 0" class="titre-md">{{$t('DFchgdl')}}</div>
          <div v-else>
            <div class="titre-md">
              <span>{{$t('DFchgdem', [dhcool(fa.dhdc, true)])}}</span>
              <span v-if="fa.nbr" class="q-ml-sm">- {{$t('DFretry', [fa.nbr])}}</span>
              <span v-if="!fa.exc">
                <span v-if="fa.id === faSt.idfdl" class="q-ml-sm">- {{$t('DFchgec')}}</span>
                <span v-else class="q-ml-sm">- {{$t('DFchgatt')}}</span>
              </span>
            </div>
            <div v-if="fa.exc">
              <div class="titre-md msg">
                {{$t('DFerr', [fa.exc[0] === 404 ? $t('ER404') : '' + fa.exc[0]])}}
              </div>
              <div class="q-my-xs q-ml-md font-mono fs-sm">
                {{$t('DFerr2', [fa.exc[0] === 404 ? fa.exc[1] : $t('EX' + fa.exc[0])])}}
              </div>
              <div class="row justify-between q-gutter-xs">
                <div class="col titre-md text-italic text-bold">
                  {{$t(fa.nbr < 4 ? 'DFretaut' : 'DFnoret')}}
                </div>
                <btn-cond v-if="session.synchro" class="col-auto self-start" 
                  :label="$t('retry')" icon="redo" @ok="retry(fa.id)"
                  :color="fa.nbr < 4 ? 'primary' : 'warning'" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="faSt.getDataDeCache(f)" class="titre-md text-italic q-y-my-sm">
          {{$t('DFdispm')}}
        </div>

      </q-page>
    </q-page-container>
  </q-layout>
  </q-dialog>

  <!-- Confirmation de suppression -->
  <q-dialog v-model="ui.d.NFsupprfichier[idc]" persistent>
    <q-card :class="styp('sm') + ' q-pa-sm'">
      <q-card-section class="column items-center q-my-md">
        <div class="titre-md text-center text-italic">{{$t('PNFsf')}}</div>
        <div class="q-mt-sm fs-md font-mono text-bold">
          <span>{{f.nom}}</span><span v-if="f.info"> - {{f.info}}</span>
          <span> (#{{f.idf}})</span>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="q-gutter-sm">
        <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD" />
        <btn-cond color="warning" icon="delete" :label="$t('confirmer')" @ok="cfSuppr" />
      </q-card-actions>
    </q-card>
  </q-dialog>

</q-btn>
</template>

<script>
import stores from '../stores/stores.mjs'
import { ref } from 'vue'
import { edvol, dhcool, styp, trapex, afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import BtnCond from '../components/BtnCond.vue'
import { saveAs } from 'file-saver'
import { SupprFichier } from '../app/operations4.mjs'
import { idb } from '../app/db.mjs'

export default {
  name: 'MenuFichier',

  props: { 
    note: Object,
    idf: String,
    simple: Boolean,
    ro: String, // raison du read-only
    aut: Number // 0: lecture seulement, 1:note perso, ida: id de l'auteur pour un groupe
  },

  components: { BoutonHelp, BtnCond, BoutonUndo },

  computed: {
    f () { return this.note.mfa.get(this.idf) || { fake: true } },
    fa () { return this.faSt.map.get(this.idf) || { fake: true } },
    fpr () { return this.f.fake ?  { fake: true } : this.note.fnom.get(this.f.nom)[0] },
    avn () { const fax = this.fpr ? this.faSt.map.get(this.fpr.idf) : null; return fax ? fax.avn : false },
    av () { return this.fa.av || false },
    modifAv () { return !(this.i1 && this.i2)},
    i1 () { return this.avn === this.xavn || this.xavn === '?' },
    i2 () { return this.av === this.xav || this.xav === '?' },
    oxn1 () { return this.i1 ? this.$t('inchange') : this.$t(this.xavn ? 'oui' : 'non2') },
    oxn2 () { return this.i2 ? this.$t('inchange') : this.$t(this.xav ? 'oui' : 'non2') },
    clr1 () { return this.i1 ? '' : 'bg-warning'},
    clr2 () { return this.i2 ? '' : 'bg-warning'}
  },

  watch: {
    av (ap, av) { this.xav = '?' },
    avn (ap, av) { this.xavn = '?' }
  },

  data () {
    return {
      xavn: '?',
      xav: '?'
    }
  },

  methods: {
    voirNote () {
      this.ui.setPage('notes')
      this.nSt.setPreSelect(this.fa.key, true)
    },

    ouvrirDF () {
      this.xav = '?'
      this.xavn = '?'
      this.ui.oD('DFouvrir', this.idc)
    },

    async validerAv () {
      const b1 = this.xavn === '?' || this.xavn === this.avn ? this.avn : this.xavn
      if (this.xav !== '?' && this.xav !== this.av) await this.faSt.setAV (this.note, this.f.nom, b1, this.f.idf, this.xav)
      else await this.faSt.setAV (this.note, this.f.nom, b1)
    },

    async retry () {
      await this.faSt.retry(this.idf)
    },

    ovSuppr () {
      this.ui.oD('NFsupprfichier', this.idc)
    },

    async cfSuppr() {
      const f = this.note.mfa.get(this.idf)
      const nom = f ? f.nom : ''
      await new SupprFichier().run(this.note, this.idf, this.aut)
      await this.faSt.delFic(this.note, nom, this.idf)
      this.ui.fD()
    },

    async blobde (b) {
      const buf = await this.note.getFichier(this.f)
      if (!buf || !buf.length) return null
      const blob = new Blob([buf], { type: this.f.type })
      return b ? blob : URL.createObjectURL(blob)
    },

    async copierFic () {
      const u8 = await this.note.getFichier(this.f)
      if (!u8) {
        await afficherDiag(this.$t('PNFgetEr'))
        return
      }
      try {
        await idb.FLset(this.f.nom, this.f.info, this.f.type, u8) // throw AppExc
      } catch (e) { await trapex (e, 2) } // ferme le dialogue
      this.ui.afficherMessage(this.$t('PNFcpp'))
      this.ppSt.modecc = false
      this.ppSt.setTabFichiers()
      this.ui.oD('pressepapier')
    },

    async affFic () {
      const url = await this.blobde()
      if (url) {
        setTimeout(() => { window.open(url, '_blank') }, 100)
        console.log(url)
      } else {
        await afficherDiag(this.$t('PNFgetEr'))
      }
    },

    async enregFic () {
      const blob = await this.blobde(true)
      if (blob) {
        saveAs(blob, this.note.nomFichier(this.f))
      } else {
        await afficherDiag(this.$t('PNFgetEr'))
      }
    },

  },

  setup () {
    const ui = stores.ui
    const idc = ref(ui.getIdc())
    return {
      ui, idc,
      nSt: stores.note,
      gSt: stores.groupe,
      faSt: stores.ficav, 
      ppSt: stores.pp,
      session: stores.session,
      edvol, dhcool, styp
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
  overflow: hidden
</style>
