<template>
  <div>
    <div :class="dkli(idx)">
      <apercu-genx v-if="people" :na="mb.na" :cv="mb.cv" :ids="mb.ids" :idx="idx" detail-people/>

      <div v-else class="row justify-between">
        <div>
          <span class="titre-lg text-bold text-primary">{{$t('moi2', [mb.na.nom])}}</span>
          <span class="q-ml-lg font-mono fs-sm">{{'#' + mb.na.id}}</span>
        </div>
        <bouton-membre v-if="!nopanel" :eg="eg" :im="mb.ids" btn/>
      </div>

      <div>
        <span class="fs-md q-mr-md">{{$t('statutmb' + st)}}</span>
        <q-btn dense size="sm" color="primary" icon="settings" @click="changeSt" :label="$t('AMchanger')"/>
      </div>

      <!-- Info à propos du groupe -->
      <div v-if="!people" class="q-py-sm">
        <div v-if="mb.info" class="titre-md">{{$t('AMinfo')}}</div>
        <show-html v-if="mb.info" class="bord" maxh="5rem" :texte="mb.info" zoom
          @edit="editInfo"/>
        <div v-else class="row">
          <div class="col fs-md text-italic">({{$t('AMnoinfo')}})</div>
          <q-btn class="col-auto btn1" size="sm" dense icon="edit" color="primary" @click="editInfo"/>
        </div>
      </div>

      <!-- Mots clés attachés au groupe par un avatar du compte -->
      <div v-if="!people && mapmc"> 
        <apercu-motscles @ok="changeMc" :idx="idx" du-compte :du-groupe="0"
          :mapmc="mapmc" edit :src="mb.mc || new Uint8Array([])"/>
      </div>

      <div class="fs-md">
        <span v-if="mb.ids === 1" class="q-mr-xs">{{$t('AMfond')}}</span>
        <span v-if="mb.idi && eg.groupe.ast[mb.idi]" class="q-mr-xs">
          {{$t('AMct1', [mbidi ? mbidi.na.nomc : '?'])}}</span>
        <span v-if="mb.idi && !eg.groupe.ast[mb.idi]" class="q-mr-xs">{{$t('AMct2', [mb.idi])}}</span>
      </div>

      <div class="row titre-md text-italic">
        <div class="col-4 text-center">{{$t('AMddi')}}</div>
        <div class="col-4 text-center">{{$t('AMdda')}}</div>
        <div class="col-4 text-center">{{$t('AMdfa')}}</div>
      </div>
      <div class="row fs-md font-mono">
        <div class="col-4 text-center">{{ddi}}</div>
        <div class="col-4 text-center">{{dda}}</div>
        <div class="col-4 text-center">{{dfa}}</div>
      </div>
    </div>

    <!-- Dialogue d'édition de l'info pour un membre avatar du compte -->
    <q-dialog v-model="infoedit" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense color="warning" size="md" icon="close" @click="MD.fD"/>
          <q-toolbar-title class="titre-lg full-width">{{$t('AMinfo')}}</q-toolbar-title>
          <bouton-help page="page1"/>
         </q-toolbar>
        <editeur-md class="height-10"
          :texte="mb.info || ''" editable modetxt :label-ok="$t('OK')" @ok="infook"/>
      </q-card>
    </q-dialog>

    <!-- Dialogue de changement de statut -->
    <q-dialog v-model="chgSt" persistent>
      <q-card class="bs petitelargeur">
        <q-toolbar class="bg-secondary text-white">
          <q-btn dense color="warning" size="md" icon="close" @click="MD.fD"/>
          <q-toolbar-title v-if="mb.estAc" class="titre-lg full-width">{{$t('AMstda', [mb.na.nom, eg.groupe.na.nom])}}</q-toolbar-title>
          <q-toolbar-title v-else class="titre-lg full-width">{{$t('AMstde', [mb.na.nomc, eg.groupe.na.nom])}}</q-toolbar-title>
          <bouton-help :page="'stmb' + cas + (mb.estAc ? 0 : 1)"/>
        </q-toolbar>

        <q-card-section>
          <div class="titre-lg q-my-xs text-italic text-center">{{$t('statutmb' + st)}}</div>

          <div v-if="ro!==''" class="q-ma-xs q-pa-xs text-bold bg-yellow-3 text-negative">
            {{ro}}</div>

          <div v-if="cas===7" class="q-my-md q-mx-sm">
            <div class="titre-md text-italic">{{$t('AMcfa1')}}</div>
            <div class="q-ml-md row">
              <div class="col-3 titre-md text-italic">{{$t('AMcf2')}}</div>
              <div class="col-9 text-bold fs-md q-gutter-sm" 
                v-for="l of gSt.animInv[0]" :key="l.id">{{l.nomc}}
              </div>
            </div>
            <div class="q-ml-md row">
              <div class="col-3 titre-md text-italic">{{$t('AMcf3')}}</div>
              <div class="col-9 text-bold fs-md q-gutter-sm" 
                v-for="l of gSt.animInv[1]" :key="l.id">{{l.nomc}}
              </div>
            </div>
          </div>

          <div v-if="cas===1" class="column justify-center">
            <q-btn class="q-ma-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('action1')" @click="setAc(7, 0)"/>
            <q-btn class="q-ma-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action60')" @click="setAc(1, 0)"/>
            <q-btn class="q-ma-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action61')" @click="setAc(1, 1)"/>
            <q-btn class="q-ma-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action62')" @click="setAc(1, 2)"/>
          </div>

          <div v-if="!mb.estAc && (cas===6 || cas===7)" class="column justify-center">
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('action2')" @click="setAc(2, 9)"/>
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('action2b')" @click="setAc(7, 0)"/>
            <q-btn v-if="st===61 || st===62" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action20')" @click="setAc(2, 0)"/>
            <q-btn v-if="st===71 || st===72" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action20b')" @click="setAc(2, 0)"/>
            <q-btn v-if="st===60 || st===62" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action21')" @click="setAc(2, 1)"/>
            <q-btn v-if="st===70 || st===72" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action21b')" @click="setAc(2, 1)"/>
            <q-btn v-if="st===60 || st===61" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action22')" @click="setAc(2, 2)"/>
            <q-btn v-if="st===70 || st===71" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action22b')" @click="setAc(2, 2)"/>
          </div>

          <div v-if="mb.estAc && (cas===6 || cas===7)" class="column justify-center">
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('actionm1')" @click="setAc(7, 0)"/>
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('actionm2')" @click="setAc(3, 0)"/>
            <q-btn class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('actionm3')" @click="setAc(4, 0)"/>
            <q-btn class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('actionm4')" @click="setAc(7, 0)"/>
          </div>

          <div v-if="!mb.estAc && cas===3" class="column justify-center">
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('action3')" @click="setAc(6, 0)"/>
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('action3b')" @click="setAc(7, 0)"/>
            <q-btn v-if="st===31 || st===32" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action30')" @click="setAc(5, 0)"/>
            <q-btn v-if="st===30 || st===32" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action31')" @click="setAc(5, 1)"/>
            <q-btn v-if="st===30 || st===31" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action32')" @click="setAc(5, 2)"/>
          </div>

          <div v-if="mb.estAc && cas===3" class="column justify-center">
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('actionm5')" @click="setAc(6, 0)"/>
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('actionm6')" @click="setAc(7, 0)"/>
            <q-btn v-if="st===31 || st===32" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('actionm8')" @click="setAc(5, 0)"/>
            <q-btn v-if="st===32" class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('actionm7')" @click="setAc(5, 1)"/>
          </div>

          <div v-if="!mb.estAc && (cas===4 || cas === 5)" class="column justify-center">
            <q-btn class="q-my-xs text-center" dense color="warning" 
              :disable="ro!==''" :label="$t('action1')" @click="setAc(7, 0)"/>
            <q-btn class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action40')" @click="setAc(1, 0)"/>
            <q-btn class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action41')" @click="setAc(1, 1)"/>
            <q-btn class="q-my-xs text-center" dense color="primary" 
              :disable="ro!==''" :label="$t('action42')" @click="setAc(1, 2)"/>
          </div>

        </q-card-section>
        <q-separator v-if="ro===''" color="orange" class="q-my-xs"/>
        <div v-if="err1!==''" class="q-ma-xs q-pa-xs text-bold bg-yellow-3 text-negative">
            {{err1}}</div>
        <div v-if="err2!==''" class="q-ma-xs q-pa-xs text-bold bg-yellow-3 text-negative">
            {{err2}}</div>
        <bouton-confirm v-if="ro==='' && err1===''" class="maauto q-my-sm" :actif="action" :confirmer="actionSt"/>
      </q-card>
    </q-dialog>
  </div>
</template>
<script>
import { ref } from 'vue'

import { dhcool } from 'src/app/util.mjs'
import stores from '../stores/stores.mjs'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonMembre from './BoutonMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import ShowHtml from './ShowHtml.vue'
import EditeurMd from './EditeurMd.vue'
import ApercuMotscles from './ApercuMotscles.vue'
import BoutonHelp from './BoutonHelp.vue'
import { MD } from '../app/modele.mjs'
import { MajMCMembre, MajInfoMembre, StatutMembre } from '../app/operations.mjs'

export default {
  name: 'ApercuMembre',

  props: { 
    mb: Object,
    eg: Object,
    mapmc: Object,
    idx: Number, 
    people: Boolean,
    nopanel: Boolean // Ne pas mettre le bouton menant à PanelMembre
  },

  components: { BoutonHelp, BoutonConfirm, ApercuGenx, ShowHtml, EditeurMd, ApercuMotscles, BoutonMembre },

  computed: {
    photo () { return this.mb && this.mb.cv && this.mb.cv.photo ? this.mb.cv.photo : this.photoDef },
    info () { return this.mb && this.mb.cv ? this.mb.cv.info || '' : '' },
    st () { return this.eg.groupe.ast[this.mb.ids] },
    cas () { return Math.floor(this.st / 10) },
    ddi () { return this.mb.ddi ? dhcool(this.mb.ddi) : '-' },
    dda () { return this.mb.dda ? dhcool(this.mb.dda) : '-' },
    dfa () { return this.mb.dfa ? dhcool(this.mb.dfa) : '-' },
    mbidi () { return this.gSt.getMembre(this.mb, this.mb.idi)},
    ro () { 
      if (this.mb.estAc) {
        const d = this.session.editDiag()
        return d || ''
      }
      if (!this.eg.estAnim) return this.$t('AMpasanst1')
      if (this.st === 32) return this.$t('AMpasanst2')
      return ''
    }
  },

  /*
  1 - invitation
  2 - modification d'invitation
  3 - acceptation d'invitation
  4 - refus d'invitation
  5 - modification du rôle laa (actif)
  6 - résiliation
  7 - oubli
  */

  data () { return {
    action: false,
    fn: 0, // fonction à effectuer
    laa: 0, // 0:lecteur, 1:auteur, 2:animateur
    err1: '',
    err2: ''
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async setAc (fn, laa) {
      // Contrôles fins
      this.err1 = '' // bloquantes
      this.err2 = '' // pas bloquantes
      if (fn === 6 && this.st === 32 ) {
        const [na, ni] = this.gSt.nbInvitsAnims
        // if (ni !== 0 && na === 1) { this.err2 = this.$t('AMdan'); return }
        if (na === 1) this.err2 = this.$t('AMdan2')
      }
      this.action = false
      this.fn = fn
      this.laa = laa
      setTimeout(() => { this.action = true }, 200)
    },
    async changeSt () {
      this.action = false
      this.ovchgSt()
    },
    async actionSt () {
      this.action = false
      this.err1 = ''
      this.err2 = ''
      // MD.fD() // ???
      /* 
        gr: groupe
        mb: membre
        fn: fonction à appliquer
        laa: lecteur, auteur, animateur
        ard: texte de l'ardoise, false s'il n'a pas changé, '' s'il est effacé
      */
      // TODO : traiter l'ardoise
      const code = await new StatutMembre().run(this.eg.groupe, this.mb, this.fn, this.laa, this.ard)
      if (this.code) {
        await afficherDiag(this.$t('AMx' + code))
      }
    },
    closeSt () {
      MD.fD()
      this.action = false
      this.err1 = ''
      this.err2 = ''
    },
    ouvrirdetails () {
      this.session.setPeopleId(this.mb.na.id)
      MD.oD('detailspeople')
    },
    async editInfo () {
      if (await this.session.edit()) this.ovinfoedit()
    },
    async infook (info) {
      await new MajInfoMembre().run(this.mb.id, this.mb.ids, info)
      MD.fD()
    },
    async changeMc (mcx) {
      const mc = mcx.length === 0 ? null : mcx
      await new MajMCMembre().run(this.mb.id, this.mb.ids, mc)
      MD.fD()
    }
  },

  setup (props) {
    const session = stores.session
    const gSt = stores.groupe
    const photoDef = stores.config.iconAvatar
 
    const infoedit = ref(false)
    function ovinfoedit () { MD.oD(infoedit) }
    const chgSt = ref(false)
    function ovchgSt () { MD.oD(chgSt) }

    return {
      MD, infoedit, ovinfoedit, chgSt, ovchgSt,
      session,
      gSt,
      photoDef
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 1px !important
  width: 1.5rem !important
</style>
