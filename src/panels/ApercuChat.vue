<template>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
    <q-header elevated>
      <q-toolbar class="bg-secondary text-white">
        <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
        <q-toolbar-title class="titre-lg text-center q-mx-sm">
          {{!zombi ? $t('CHoch3', [cvI.nom, cvE.nom]) : $t('CHzombi')}}
        </q-toolbar-title>
        <bouton-help page="chat_maj"/>
      </q-toolbar>
      <q-toolbar inset v-if="!zombi" class="bg-secondary text-white">
        <div v-if="racE || racI || dispE" class="row q-gutter-sm">
          <div v-if="racE" class="msg">{{$t('CHraccroche2', [cvE.nom])}}</div>
          <div v-if="racI" class="msg">{{$t('CHraccroche')}}</div>
          <div v-if="dispE" class="msg2 titre-lg">{{$t('disparu')}}</div>
        </div>
        <div v-if="chatX.mutI" class="msg">{{$t('CHmutI', [cvE.nom, chatX.mutI === 2 ? 'A' : 'O'])}}</div>
        <div v-if="chatX.mutE" class="msg">{{$t('CHmutE', [cvE.nom, chatX.mutE === 2 ? 'A' : 'O'])}}</div>
      </q-toolbar>
      <div v-if="!zombi">
        <apercu-genx v-if="!dispE" class="bordb" :id="chatX.idE" :idx="0" />
        <div :class="sty() + 'q-pa-xs row q-gutter-xs items-center'">
          <btn-cond v-if="chatX.stE !== 2" :label="$t('CHadd1')" icon="add"
            @ok="editer(false)" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <btn-cond v-if="chatX.stE !== 2"  :label="$t('CHadd2')" icon="savings"
            @ok="editer(true)" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <btn-cond v-if="!racI" :label="$t('CHrac')" icon="phone_disabled" 
            @ok="raccrocher()" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
          <btn-cond v-if="chatX.stE !== 2"  :label="$t('CHmutb')" color="warning" icon="settings"
            @ok="ovMut()" :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
        </div>
      </div>
    </q-header>

    <q-page-container>
      <q-card  v-if="!zombi" class="q-pa-sm">
        <div v-for="it in chatX.items" :key="it.dh + '/' + it.a">
          <q-chat-message :sent="it.a===0" 
            :bg-color="it.a ? 'brown-10' : 'secondary'" 
            text-color="white"
            :stamp="dhcool(it.dh)">
            <sd-blanc v-if="!it.dhx" :texte="it.t"/>
            <div v-else class="text-italic bg-yellow-3 text-negative">{{$t('CHeffa', [dhcool(it.dhx)])}}</div>
            <template v-slot:name>
              <div class="full-width row justify-between items-center">
                <span>{{it.a===0 ? $t('moi') : cvE.nom}}</span>
                <btn-cond v-if="it.a===0 && !it.dhx" size="sm" icon="clear" color="secondary"
                  @ok="effacer(it.dh)" 
                  :cond="ui.urgence ? 'cUrgence' : 'cEdit'" />
              </div>
            </template>
          </q-chat-message>
        </div>
      </q-card>
    </q-page-container>

    <!-- Gestion des mutations -->
    <q-dialog v-model="ui.d[idc].mutation">
      <q-card :class="styp('sm')">
        <q-card-section v-if="chatX.mutI" class="q-pa-md fs-md">
          <div class="titre-lg">{{$t('CHmutI', [cvE.nom, chatX.mutI === 2 ? 'A' : 'O'])}}</div>
          <div class="row items-center q-gutter-sm justify-end">
            <btn-cond :label="$t('CHmuts', [cvE.nom, chatX.mutI === 2 ? 'A' : 'O'])" color="warning" icon="close"
              @ok="cfI = true"/>
            <bouton-confirm :actif="cfI" :confirmer="delMutI"/>
          </div>
        </q-card-section>

        <q-card-section v-if="!chatX.mutI && session.estA" class="q-pa-md fs-md">
          <div v-if="!stE.del">{{$t('CHmutn1', [cvE.nom])}}</div>
          <div class="row items-center q-gutter-sm justify-end">
            <btn-cond :label="$t('CHmutd', [cvE.nom, 'A'])" color="warning" icon="check"
              @ok="cfA = true"/>
            <bouton-confirm :actif="cfA" :confirmer="demMutA"/>
          </div>
        </q-card-section>

        <q-card-section v-if="!chatX.mutI && !session.estA" class="q-pa-md fs-md">
          <div v-if="!stE.del || stE.idp !== sesion.compte.idp">{{$t('CHmutn2', [cvE.nom])}}</div>
          <div class="row items-center q-gutter-sm justify-end">
            <btn-cond :label="$t('CHmutd', [cvE.nom, 'O'])" color="warning" icon="check"
              @ok="cfO = true"/>
            <bouton-confirm :actif="cfO" :confirmer="demMutO"/>
          </div>
        </q-card-section>

        <q-card-section v-if="chatX.mutE === 2" class="q-pa-md fs-md"><!-- il est O -->
          <div class="titre-lg">{{$t('CHmutE', [cvE.nom, 'A'])}}</div>
          <div v-if="!session.compte.del">{{$t('CHmutr1')}}</div>
          <div v-if="session.compte.del && session.compte.idp !== stE.idp">{{$t('CHmutr2', [cvE.nom])}}</div>
          <btn-cond :label="$t('CHmutd', [cvE.nom, 'A'])" color="warning" icon="check"
            @ok="mutA"/>
        </q-card-section>

        <q-card-section v-if="chatX.mutE === 1" class="q-pa-md fs-md"><!-- il est A -->
          <div class="titre-lg">{{$t('CHmutE', [cvE.nom, 'O'])}}</div>
          <div v-if="!session.compte.del">{{$t('CHmutr1')}}</div>
          <btn-cond :label="$t('CHmutd', [cvE.nom, 'O'])" color="warning" icon="check"
            @ok="mutO"/>
        </q-card-section>

        <q-card-actions align="center">
          <btn-cond flat :label="$t('jailu')" @ok="ui.fD"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation d'effacement d'un échange -->
    <q-dialog v-model="ui.d[idc].ACconfirmeff">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHeff')}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="delete" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHeffcf')" @ok="effop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Confirmation du raccrocher -->
    <q-dialog v-model="ui.d[idc].ACconfirmrac">
      <q-card :class="styp('sm')">
        <q-card-section class="q-pa-md fs-md text-center">
          {{$t('CHrac2', [cvE.nom])}}
        </q-card-section>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond color="warning" icon="clear"
            :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('CHrac')" @ok="passifop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Dialogue d'ajout d'un item au chat -->
    <q-dialog v-model="ui.d[idc].ACchatedit">
      <q-card :class="styp('sm')">
        <q-toolbar class="bg-secondary text-white">
          <btn-cond color="warning" icon="close" @ok="ui.fD"/>
          <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('CHadd1')}}</q-toolbar-title>
          <bouton-help page="chat_maj"/>
        </q-toolbar>
        <q-toolbar v-if="avecDon" inset class="bg-secondary text-white">
          <q-toolbar-title class="row justify-center items-center q-gutter-md">
            <div v-if="stE.cpt">
              <div class="titre-md text-bold">{{$t('CHmdon')}}</div>
              <q-select :options="cfg.dons2" size="md" v-model="mdon" dense color="white"/>
              <q-checkbox class="titre-md text-bold" size="md" dense 
                left-label v-model="dconf" :label="$t('CHcdon')" />
            </div>
            <div v-else class="msg">{{$t('CHdoncpt')}}</div>
          </q-toolbar-title>
        </q-toolbar>
        <div v-if="avecDon && stE.cpt && (mdon + 2 > solde)" class="msg text-bold">{{$t('CHcred', [solde, mdon])}}</div>
        <editeur-md mh="20rem" v-model="txt" :texte="''" editable modetxt/>
        <q-card-actions align="right" class="q-gutter-sm">
          <btn-cond flat icon="undo" :label="$t('renoncer')" @ok="ui.fD"/>
          <btn-cond icon="add" :cond="ui.urgence ? 'cUrgence' : 'cEdit'"
            :label="$t('valider')"
            :disable="avecDon && stE.cpt && (mdon > solde + 2)"
            @ok="addop"/>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup>
  import { useI18n } from 'vue-i18n'
  const $t = useI18n().t

  import { ref, computed, onUnmounted } from 'vue'

  import stores from '../stores/stores.mjs'

  import { styp, sty, dhcool, dkli, afficherDiag, $q } from '../app/util.mjs'
  import { GetCompta, MajChat, PassifChat, StatutChatE } from '../app/operations4.mjs'
  import { ID } from '../app/api.mjs'

  import SdBlanc from '../components/SdBlanc.vue'
  import EditeurMd from '../components/EditeurMd.vue'
  import ApercuGenx from '../components/ApercuGenx.vue'
  import BoutonHelp from '../components/BoutonHelp.vue'
  import BtnCond from '../components/BtnCond.vue'
  import BoutonConfirm from '../components/BoutonConfirm.vue'

  const props = defineProps({ 
    id: String, 
    ids: String,
    urgence: Boolean
  })

  const ui = stores.ui
  const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
  const aSt = stores.avatar
  const session = stores.session
  const cfg = stores.config
  const pSt = stores.people

  const cfI = ref(false)
  const cfA = ref(false)
  const cfO = ref(false)

  const chatX = computed(() => aSt.getChat(props.id, props.ids))
  const zombi = computed(() => !chatX.value )
  // const nomE = computed(() => chatX.value ? session.getCV(chatX.value.idE).nom : '')
  // const nomI = computed(() => chatX.value ? session.getCV(chatX.value.id).nom : '')
  const estDel = computed(() => ID.estComptable(chatX.value.idE) || session.estDelegue)
  const cvE = computed(() => session.getCV(chatX.value.idE))
  const cvI = computed(() => session.getCV(chatX.value.id))
  const racI = computed(() => chatX.value.stI === 0)
  const racE = computed(() => chatX.value.stE === 0)
  const dispE = computed(() => chatX.value.stE === 2)

  const dconf = ref(false)
  const txt = ref('')
  const avecDon = ref(false)
  const mdon = ref(cfg.dons2[0])
  const dheff = ref(0)
  const solde = ref(0)
  const stE = ref(null)

  async function getStE () {
    stE.value = new StatutChatE().run(chatX.value.ids)
  }

  async function effacer (dh) {
    dheff.value = dh
    nbci.value--
    ui.oD('ACconfirmeff', idc)
  }

  async function effop () {
    ui.fD()
    const disp = await new MajChat().run(chatX.value, null, dheff.value)
    if (disp) { await afficherDiag(this.$t('CHdisp')) }
    dheff.value = 0
  }

  async function addop () {
    ui.fD()
    const don = avecDon.value && stE.value.cpt ? mdon.value : 0
    const t = (don ? ($t('CHdonde', [don]) + '\n') : '') + txt.value
    const disp = await new MajChat().run(chatX.value, t, 0, don, props.urgence)
    if (disp) { await afficherDiag($t('CHdisp')) }
    txt.value = ''
  }

  async function passifop () {
    ui.fD()
    const suppr = await new PassifChat().run(chatX.value)
    if (suppr) { await afficherDiag($t('CHsuppr')) }
  }

  async function editer (avecD) {
    if (avecD) { 
      await getStE ()
      dconf.value = false
      await session.reloadCompta()
      solde.value = session.compta.compteurs.soldeCourant
      avecDon.value = true
    } else {
      avecDon.value = false
    }
    txt.value = chatX.value ? chatX.value.txt : ''
    ui.oD('ACchatedit', idc)
  }

  async function raccrocher () {
    txt.value = ''
    ui.oD('ACconfirmrac', idc)
  }

  async function ovMut () {
    if (props.id !== session.compteId) {
      await afficherDiag($t('CHmute'))
      return
    }
    await getStE()
    if (!stE.value || !stE.value.cpt) {
      await afficherDiag($t('CHmute'))
      return
    }
    cfI.value = false
    cfA.value = false
    cfO.value = false
    this.ui.oD('mutation', idc)
  }

  async function delMutI () {
    ui.fD()
    console.log('delMutI')
    await new MutChat().run(chatX.value, 0)
  }

  async function demMutA () {
    ui.fD()
    console.log('demMutA')
    await new MutChat().run(chatX.value, 2)
  }

  async function demMutO () {
    ui.fD()
    console.log('demMutO')
    await new MutChat().run(chatX.value, 1)
  }

  async function mutA () {
    ui.fD()
    console.log('mutA')
  }

  async function mutO () {
    ui.fD()
    console.log('mutO')    
  }

</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bordb
  border-bottom: 1px solid $grey-5
</style>
